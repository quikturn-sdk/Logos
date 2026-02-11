/**
 * @quikturn/logos SDK — Server Fetch Wrapper
 *
 * Low-level fetch wrapper for the server entry point. Handles HTTP error
 * mapping, retry logic for rate-limited and server-error responses,
 * AbortSignal propagation, and proactive warning callbacks when rate-limit
 * or quota headroom drops below 10%.
 *
 * Unlike the browser fetcher, this module sends the secret key as an
 * `Authorization: Bearer` header — tokens are NEVER appended as query
 * parameters.
 */

import {
  LogoError,
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  QuotaExceededError,
} from "../errors";
import { parseRetryAfter } from "../headers";
import { delay } from "../internal/delay";
import { MAX_RETRY_AFTER_SECONDS } from "../constants";

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link serverFetch}.
 *
 * - `token`              — Required: secret key (`sk_` prefix) sent as Bearer token.
 * - `maxRetries`         — Maximum number of retry attempts for 429/500 responses. Default: 2.
 * - `signal`             — An `AbortSignal` to cancel the in-flight request.
 * - `format`             — MIME type string used as the `Accept` request header.
 * - `onRateLimitWarning` — Called when `X-RateLimit-Remaining` drops below 10% of the limit.
 * - `onQuotaWarning`     — Called when `X-Quota-Remaining` drops below 10% of the limit.
 */
export interface ServerFetcherOptions {
  token: string;
  maxRetries?: number;
  signal?: AbortSignal;
  format?: string;
  onRateLimitWarning?: (remaining: number, limit: number) => void;
  onQuotaWarning?: (remaining: number, limit: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default maximum retries for 429 responses. */
const DEFAULT_MAX_RETRIES = 2;

/** Fallback Retry-After value (seconds) when the header is absent on a 429. */
const DEFAULT_RETRY_AFTER_SECONDS = 60;

/** Fixed retry delay (ms) for 500 server errors before the single retry. */
const SERVER_ERROR_RETRY_DELAY_MS = 1000;

/** Threshold ratio below which warning callbacks are invoked. */
const WARNING_THRESHOLD = 0.1;

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the domain segment from a Logos API URL path.
 *
 * Given `"https://logos.getquikturn.io/github.com"`, returns `"github.com"`.
 * Falls back to `"unknown"` if the path is empty.
 */
function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.slice(1); // Remove leading "/"
    return path || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Returns `true` when an error has the shape of a DOM `AbortError`.
 */
function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

/**
 * Checks response headers for low rate-limit / quota headroom and invokes
 * the appropriate warning callback when remaining drops below 10% of the
 * tier limit.
 */
function emitWarnings(
  headers: Headers,
  onRateLimitWarning?: (remaining: number, limit: number) => void,
  onQuotaWarning?: (remaining: number, limit: number) => void,
): void {
  if (onRateLimitWarning) {
    const remaining = parseInt(headers.get("X-RateLimit-Remaining") ?? "", 10);
    const limit = parseInt(headers.get("X-RateLimit-Limit") ?? "", 10);
    if (!Number.isNaN(remaining) && !Number.isNaN(limit) && limit > 0) {
      if (remaining < limit * WARNING_THRESHOLD) {
        onRateLimitWarning(remaining, limit);
      }
    }
  }

  if (onQuotaWarning) {
    const remaining = parseInt(headers.get("X-Quota-Remaining") ?? "", 10);
    const limit = parseInt(headers.get("X-Quota-Limit") ?? "", 10);
    if (!Number.isNaN(remaining) && !Number.isNaN(limit) && limit > 0) {
      if (remaining < limit * WARNING_THRESHOLD) {
        onQuotaWarning(remaining, limit);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Performs a fetch request to the Logos API with Bearer token authentication,
 * error mapping, and retry logic.
 *
 * **Key difference from browser fetcher:**
 * The secret key is sent as an `Authorization: Bearer {token}` header and is
 * NEVER included in the URL query string.
 *
 * **Error mapping:**
 * | Status | Error Class           | Notes                                      |
 * |--------|-----------------------|--------------------------------------------|
 * | 401    | AuthenticationError   | Invalid or missing API token               |
 * | 403    | ForbiddenError        | Body text used as `reason`                 |
 * | 404    | NotFoundError         | Domain extracted from URL path             |
 * | 429    | QuotaExceededError    | When `X-Quota-Limit` header is present     |
 * | 429    | RateLimitError        | After retries are exhausted                |
 * | 500    | LogoError             | After a single retry attempt               |
 *
 * **Retry behavior:**
 * - 429: Waits `Retry-After` seconds (default 60s), retries up to `maxRetries`.
 *        If `X-Quota-Limit` is present, throws `QuotaExceededError` immediately.
 * - 500: Retries once after a 1-second delay, then throws.
 * - AbortError: Never retried; throws immediately.
 * - Network errors: Never retried; throws immediately.
 *
 * @param url     - Fully-qualified Logos API URL (built by `logoUrl`).
 * @param options - Fetch configuration including the required `token`.
 * @returns The raw `Response` object on success (2xx).
 *
 * @throws {AuthenticationError} On 401.
 * @throws {ForbiddenError} On 403.
 * @throws {NotFoundError} On 404.
 * @throws {RateLimitError} On 429 after retries exhausted (no quota header).
 * @throws {QuotaExceededError} On 429 with `X-Quota-Limit` header.
 * @throws {LogoError} On 500, network error, or abort.
 */
export async function serverFetch(
  url: string,
  options: ServerFetcherOptions,
): Promise<Response> {
  const { token } = options;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const signal = options.signal;
  const format = options.format;
  const onRateLimitWarning = options.onRateLimitWarning;
  const onQuotaWarning = options.onQuotaWarning;

  // Build request headers — always include Authorization: Bearer
  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (format) {
    requestHeaders["Accept"] = format;
  }

  // Track retry attempts for 429 responses
  let retryCount = 0;
  // Track whether we have already retried a 500
  let serverErrorRetried = false;

   
  while (true) {
    let response: Response;

    try {
      response = await globalThis.fetch(url, {
        headers: requestHeaders,
        signal,
      });
    } catch (err: unknown) {
      // AbortError — never retry
      if (isAbortError(err)) {
        throw new LogoError("Request aborted", "ABORT_ERROR");
      }

      // Network error — never retry
      const message =
        err instanceof Error ? err.message : "Unknown network error";
      throw new LogoError(`Network error: ${message}`, "NETWORK_ERROR");
    }

    // ----- Success (2xx) -----
    if (response.ok) {
      emitWarnings(response.headers, onRateLimitWarning, onQuotaWarning);
      return response;
    }

    // ----- 401 Unauthorized -----
    if (response.status === 401) {
      throw new AuthenticationError("Authentication failed");
    }

    // ----- 403 Forbidden -----
    if (response.status === 403) {
      const body = await response.text();
      const reason = body.slice(0, 256) || "unknown";
      throw new ForbiddenError("Access forbidden", reason);
    }

    // ----- 404 Not Found -----
    if (response.status === 404) {
      const domain = extractDomainFromUrl(url);
      throw new NotFoundError("Logo not found", domain);
    }

    // ----- 429 Rate Limited / Quota Exceeded -----
    if (response.status === 429) {
      const retryAfter =
        parseRetryAfter(response.headers) ?? DEFAULT_RETRY_AFTER_SECONDS;

      // If X-Quota-Limit is present, this is a quota issue — throw immediately
      const quotaLimitHeader = response.headers.get("X-Quota-Limit");
      if (quotaLimitHeader !== null) {
        const quotaLimit = parseInt(quotaLimitHeader, 10) || 0;
        const quotaRemaining =
          parseInt(response.headers.get("X-Quota-Remaining") ?? "0", 10) || 0;
        const used = quotaLimit - quotaRemaining;
        throw new QuotaExceededError(
          "Monthly quota exceeded",
          retryAfter,
          quotaLimit,
          used,
        );
      }

      // Rate limit — retry if attempts remain
      if (retryCount < maxRetries) {
        retryCount++;
        const retryDelay = Math.min(Math.max(1, retryAfter), MAX_RETRY_AFTER_SECONDS) * 1000; // floor at 1s, cap at 300s
        await delay(retryDelay);
        continue;
      }

      // Retries exhausted — throw RateLimitError
      const remaining =
        parseInt(
          response.headers.get("X-RateLimit-Remaining") ?? "0",
          10,
        ) || 0;
      const resetEpoch =
        parseInt(response.headers.get("X-RateLimit-Reset") ?? "0", 10) || 0;
      throw new RateLimitError(
        "Rate limit exceeded",
        retryAfter,
        remaining,
        new Date(resetEpoch * 1000),
      );
    }

    // ----- 400 Bad Request -----
    if (response.status === 400) {
      const body = await response.text();
      throw new BadRequestError(body.slice(0, 256) || "Bad request");
    }

    // ----- 500 Server Error -----
    if (response.status === 500) {
      if (!serverErrorRetried) {
        serverErrorRetried = true;
        await delay(SERVER_ERROR_RETRY_DELAY_MS);
        continue;
      }

      const body = await response.text();
      throw new LogoError(
        body.slice(0, 256) || "Internal server error",
        "SERVER_ERROR",
        500,
      );
    }

    // ----- Other unexpected status codes -----
    await response.text();
    throw new LogoError(
      `Unexpected response: ${response.status}`,
      "UNEXPECTED_ERROR",
      response.status,
    );
  }
}
