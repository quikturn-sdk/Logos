/**
 * @quikturn/logos SDK -- Scrape Poller
 *
 * Handles 202 (scrape_pending) responses from the Logos API. When the API
 * returns a 202 with a {@link ScrapePendingResponse} body, this module polls
 * the scrape job status URL with exponential backoff until the job completes,
 * fails, or the configured timeout elapses.
 *
 * On completion, re-fetches the original logo URL (with optional token) and
 * returns the final Response to the caller.
 */

import type { ScrapePendingResponse, ScrapeProgressEvent } from "../types";
import { LogoError, ScrapeTimeoutError } from "../errors";
import { delay } from "../internal/delay";
/** A fetch function that takes a URL and returns a Response promise. */
type FetchFn = (url: string) => Promise<Response>;

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link handleScrapeResponse}.
 *
 * - `scrapeTimeout`    -- Maximum time (ms) to wait for the scrape to complete. Default: 30_000.
 * - `onScrapeProgress` -- Called after each poll with the latest progress event.
 * - `signal`           -- An `AbortSignal` to cancel the polling loop.
 * - `token`            -- API token appended to the final logo re-fetch URL.
 */
export interface ScrapePollerOptions {
  scrapeTimeout?: number;
  onScrapeProgress?: (event: ScrapeProgressEvent) => void;
  signal?: AbortSignal;
  token?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default scrape polling timeout in milliseconds. */
const DEFAULT_SCRAPE_TIMEOUT_MS = 30_000;

/** Maximum backoff delay between poll requests. */
const MAX_BACKOFF_MS = 5000;

/** Maximum number of consecutive network-error retries per poll attempt. */
const MAX_POLL_RETRIES = 3;

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Appends a `token` query parameter to the given URL using the URL API
 * for correct encoding and query-string handling.
 */
function appendToken(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("token", token);
  return parsed.toString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Inspects a response from the Logos API and, if it is a 202 (scrape pending),
 * polls the scrape job until completion and re-fetches the logo.
 *
 * **Non-202 responses** are returned immediately as a passthrough.
 *
 * **202 responses** trigger the following lifecycle:
 * 1. Parse the {@link ScrapePendingResponse} JSON body to extract `scrapeJob`.
 * 2. Wait `estimatedWaitMs` (the initial backoff interval).
 * 3. Poll `scrapeJob.pollUrl` via `fetchFn`, parse the {@link ScrapeProgressEvent}.
 * 4. Call `onScrapeProgress` with the event.
 * 5. If `status === "complete"`, re-fetch `originalUrl` (with token if provided).
 * 6. If `status === "failed"`, throw `LogoError` with code `SCRAPE_FAILED`.
 * 7. If `status === "pending"`, double the backoff (capped at 5 s) and repeat.
 * 8. If `scrapeTimeout` elapses, throw {@link ScrapeTimeoutError}.
 * 9. If `signal` is aborted, throw `LogoError` with code `ABORT_ERROR`.
 *
 * @param response    -- The raw Response from the initial logo fetch.
 * @param originalUrl -- The original logo URL (re-fetched after scrape completes).
 * @param fetchFn     -- The fetch function (typically `browserFetch`).
 * @param options     -- Optional polling configuration.
 * @returns The final logo Response on success.
 *
 * @throws {ScrapeTimeoutError} When polling exceeds `scrapeTimeout`.
 * @throws {LogoError} When the scrape job fails, is aborted, or encounters a network error.
 */
export async function handleScrapeResponse(
  response: Response,
  originalUrl: string,
  fetchFn: FetchFn,
  options?: ScrapePollerOptions,
): Promise<Response> {
  // ---- Passthrough for non-202 responses ----
  if (response.status !== 202) {
    return response;
  }

  // ---- Parse 202 body ----
  let body: ScrapePendingResponse;
  try {
    body = (await response.json()) as ScrapePendingResponse;
  } catch {
    throw new LogoError("Failed to parse scrape response", "SCRAPE_PARSE_ERROR");
  }
  const { scrapeJob } = body;
  const { jobId, pollUrl, estimatedWaitMs } = scrapeJob;

  // ---- Validate pollUrl origin matches the original API origin ----
  try {
    const originalOrigin = new URL(originalUrl).origin;
    const pollOrigin = new URL(pollUrl).origin;
    if (pollOrigin !== originalOrigin) {
      throw new LogoError(
        "Poll URL origin does not match API origin",
        "SCRAPE_PARSE_ERROR",
      );
    }
  } catch (err) {
    if (err instanceof LogoError) throw err;
    throw new LogoError("Invalid poll URL", "SCRAPE_PARSE_ERROR");
  }

  // ---- Resolve options ----
  const scrapeTimeout = options?.scrapeTimeout ?? DEFAULT_SCRAPE_TIMEOUT_MS;
  const onScrapeProgress = options?.onScrapeProgress;
  const signal = options?.signal;
  const token = options?.token;

  // ---- Polling loop ----
  const MIN_BACKOFF_MS = 500;
  let backoff = Math.min(Math.max(MIN_BACKOFF_MS, estimatedWaitMs), MAX_BACKOFF_MS);
  const startTime = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check timeout BEFORE delay
    const elapsed = Date.now() - startTime;
    const remaining = scrapeTimeout - elapsed;
    if (remaining <= 0) {
      throw new ScrapeTimeoutError("Scrape timed out", jobId, elapsed);
    }

    // Wait the current backoff interval (abort-aware), clamped to remaining time
    await delay(Math.min(backoff, remaining), signal);

    // Poll with network-error retries
    let pollResponse: Response;
    let retries = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        pollResponse = await fetchFn(pollUrl);
        break;
      } catch (err: unknown) {
        retries++;
        if (retries >= MAX_POLL_RETRIES) {
          throw err;
        }
        // Brief delay before retry (abort-aware)
        await delay(backoff, signal);
      }
    }

    // Parse the poll result
    let event: ScrapeProgressEvent;
    try {
      event = (await pollResponse.json()) as ScrapeProgressEvent;
    } catch {
      throw new LogoError("Failed to parse poll response", "SCRAPE_PARSE_ERROR");
    }

    // Notify listener
    if (onScrapeProgress) {
      onScrapeProgress(event);
    }

    // Handle terminal states
    if (event.status === "complete") {
      const finalUrl = token ? appendToken(originalUrl, token) : originalUrl;
      return fetchFn(finalUrl);
    }

    if (event.status === "failed") {
      throw new LogoError(
        event.error ?? "Scrape failed",
        "SCRAPE_FAILED",
      );
    }

    // Still pending -- increase backoff (exponential, capped)
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
  }
}
