/**
 * @quikturn/logos SDK -- Server Batch Operations
 *
 * Fetches logos for multiple domains with concurrency control, order
 * preservation, partial failure handling, rate-limit backoff, and
 * AbortSignal support.
 *
 * The module is decoupled from the server fetcher via a `fetchFn`
 * parameter, making it easy to test and compose with different fetch
 * implementations.
 */

import type { ThemeOption, SupportedOutputFormat, FormatShorthand, LogoMetadata } from "../types";
import { LogoError, RateLimitError } from "../errors";
import { delay } from "../internal/delay";

/** Maximum rate-limit retries per domain in batch operations. */
const MAX_RATE_LIMIT_RETRIES = 3;

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

/**
 * Options for batch logo fetching.
 *
 * - `concurrency`     -- Maximum parallel fetches. Default: 5.
 * - `size`            -- Output width in pixels.
 * - `greyscale`       -- When true, applies saturation: 0 transformation.
 * - `theme`           -- "light" or "dark" gamma curve.
 * - `format`          -- Output image format (MIME type or shorthand).
 * - `signal`          -- AbortSignal to cancel remaining batch items.
 * - `continueOnError` -- When true (default), errors are captured per-domain
 *                        rather than aborting the entire batch.
 */
export interface BatchOptions {
  concurrency?: number;
  size?: number;
  greyscale?: boolean;
  theme?: ThemeOption;
  format?: SupportedOutputFormat | FormatShorthand;
  signal?: AbortSignal;
  continueOnError?: boolean;
}

/**
 * A single result from a batch fetch operation.
 *
 * On success: `success` is true, `buffer`, `contentType`, and `metadata` are set.
 * On failure: `success` is false, `error` is set.
 */
export interface BatchResult {
  domain: string;
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  metadata?: LogoMetadata;
  error?: LogoError;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches logos for multiple domains with concurrency control.
 * Yields results in the same order as the input domains array.
 *
 * The `fetchFn` parameter is a function that takes a domain and returns
 * a result object with buffer, contentType, metadata. This decouples
 * the batch module from the server fetcher implementation.
 *
 * Rate limit handling: when fetchFn throws a {@link RateLimitError},
 * the batch pauses ALL pending work for `retryAfter` seconds before
 * retrying the failed domain.
 *
 * @param domains  - Array of domain strings to fetch logos for.
 * @param fetchFn  - Async function that fetches a single logo by domain.
 * @param options  - Optional batch configuration.
 * @yields {BatchResult} Results in the same order as the input domains.
 */
export async function* getMany(
  domains: string[],
  fetchFn: (domain: string) => Promise<{ buffer: Buffer; contentType: string; metadata: LogoMetadata }>,
  options?: BatchOptions,
): AsyncGenerator<BatchResult> {
  if (domains.length === 0) return;

  const concurrency = options?.concurrency ?? 5;
  const continueOnError = options?.continueOnError ?? true;
  const signal = options?.signal;

  // Results stored by index for order preservation
  const results: (BatchResult | undefined)[] = new Array(domains.length);
  // Tracks which indices have been resolved
  const settled = new Set<number>();

  // Notification system: the generator yields results in order and waits
  // for the next expected index to become available, or for all workers
  // to finish (so it knows no more results will come).
  let nextYieldIndex = 0;
  let notifyReady: (() => void) | null = null;
  let workersFinished = false;

  /**
   * Creates a promise that resolves when either:
   * 1. The result at nextYieldIndex becomes available, OR
   * 2. All workers have finished (no more results will come)
   */
  function waitForNext(): Promise<void> {
    if (settled.has(nextYieldIndex) || workersFinished) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      notifyReady = resolve;
    });
  }

  /**
   * Wakes up the generator if it is waiting. Called when a result is
   * settled or when all workers have finished.
   */
  function wakeGenerator(): void {
    if (notifyReady) {
      const fn = notifyReady;
      notifyReady = null;
      fn();
    }
  }

  /**
   * Marks an index as settled and notifies the generator if
   * the next expected result is now available.
   */
  function markSettled(index: number): void {
    settled.add(index);
    if (index === nextYieldIndex) {
      wakeGenerator();
    }
  }

  /**
   * Processes a single domain fetch, storing the result at the
   * correct index. Handles RateLimitError with backoff + retry,
   * and wraps other errors as failed BatchResults when continueOnError
   * is true.
   */
  async function processDomain(index: number, domain: string): Promise<void> {
    let rateLimitRetries = 0;
     
    while (true) {
      try {
        const { buffer, contentType, metadata } = await fetchFn(domain);
        results[index] = {
          domain,
          success: true,
          buffer,
          contentType,
          metadata,
        };
        markSettled(index);
        return;
      } catch (err: unknown) {
        // Rate limit: pause and retry this domain (up to MAX_RATE_LIMIT_RETRIES)
        if (err instanceof RateLimitError) {
          rateLimitRetries++;
          if (rateLimitRetries > MAX_RATE_LIMIT_RETRIES) {
            // Exhausted rate limit retries -- treat as error
            if (continueOnError) {
              results[index] = { domain, success: false, error: err };
              markSettled(index);
              return;
            }
            throw err;
          }
          const waitMs = Math.max(1, err.retryAfter) * 1000;
          await delay(waitMs, signal);
          continue; // retry after pause
        }

        // Other errors: capture as failed result or re-throw
        if (continueOnError) {
          const logoError = err instanceof LogoError
            ? err
            : new LogoError(
                err instanceof Error ? err.message : "Unknown error",
                "UNEXPECTED_ERROR",
              );
          results[index] = {
            domain,
            success: false,
            error: logoError,
          };
          markSettled(index);
          return;
        }

        // continueOnError is false: propagate the error
        throw err;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Concurrency pool
  //
  // Uses a queue-based semaphore: we start up to `concurrency` workers
  // from a shared queue index. Each worker pulls the next unprocessed
  // domain when it finishes its current one.
  // -----------------------------------------------------------------------

  let queueIndex = 0;

  async function worker(): Promise<void> {
    while (queueIndex < domains.length) {
      // Check abort before starting a new fetch
      if (signal?.aborted) return;

      const idx = queueIndex++;
      const domain = domains[idx]!;
      await processDomain(idx, domain);
    }
  }

  // Launch workers (up to concurrency or domain count, whichever is smaller)
  const workerCount = Math.min(concurrency, domains.length);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  // When all workers finish, notify the generator so it can exit
  // if it is waiting for results that will never come (due to abort).
  void Promise.allSettled(workers).then(() => {
    workersFinished = true;
    wakeGenerator();
  });

  // Yield results in order as they become available
  while (nextYieldIndex < domains.length) {
    await waitForNext();

    // If workers are finished and the next result is not settled,
    // no more results will come (remaining domains were skipped due to abort).
    if (!settled.has(nextYieldIndex)) {
      break;
    }

    // Yield all consecutively available results
    while (nextYieldIndex < domains.length && settled.has(nextYieldIndex)) {
      yield results[nextYieldIndex]!;
      nextYieldIndex++;
    }
  }
}
