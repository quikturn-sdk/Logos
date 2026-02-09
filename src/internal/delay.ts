/**
 * @quikturn/logos SDK -- Shared Abort-Aware Delay
 *
 * Promise-based delay utility used by the browser fetcher and scrape poller.
 * Supports an optional AbortSignal to reject early when the caller cancels
 * the operation.
 */

import { LogoError } from "../errors";

/**
 * Promise-based delay that respects AbortSignal.
 * Rejects with LogoError if signal is aborted during the wait.
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new LogoError("Aborted", "ABORT_ERROR"));
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new LogoError("Aborted", "ABORT_ERROR"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
