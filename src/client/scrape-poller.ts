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
import type { browserFetch } from "./fetcher";

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
 * Creates a promise that resolves after `ms` milliseconds, or rejects
 * immediately when the provided `AbortSignal` fires.
 *
 * Compatible with both real and fake timers (Vitest `vi.useFakeTimers`).
 */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new LogoError("Scrape polling aborted", "ABORT_ERROR"));
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(new LogoError("Scrape polling aborted", "ABORT_ERROR"));
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Appends a `token` query parameter to the given URL.
 * If the URL already contains query parameters, appends with `&`;
 * otherwise appends with `?`.
 */
function appendToken(url: string, token: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${token}`;
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
  fetchFn: typeof browserFetch,
  options?: ScrapePollerOptions,
): Promise<Response> {
  // ---- Passthrough for non-202 responses ----
  if (response.status !== 202) {
    return response;
  }

  // ---- Parse 202 body ----
  const body = (await response.json()) as ScrapePendingResponse;
  const { scrapeJob } = body;
  const { jobId, pollUrl, estimatedWaitMs } = scrapeJob;

  // ---- Resolve options ----
  const scrapeTimeout = options?.scrapeTimeout ?? DEFAULT_SCRAPE_TIMEOUT_MS;
  const onScrapeProgress = options?.onScrapeProgress;
  const signal = options?.signal;
  const token = options?.token;

  // ---- Polling loop ----
  let backoff = estimatedWaitMs;
  const startTime = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Wait the current backoff interval (abort-aware)
    await delay(backoff, signal);

    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= scrapeTimeout) {
      throw new ScrapeTimeoutError("Scrape timed out", jobId, elapsed);
    }

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
        // Brief delay before retry
        await delay(backoff);
      }
    }

    // Parse the poll result
    const event = (await pollResponse.json()) as ScrapeProgressEvent;

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
