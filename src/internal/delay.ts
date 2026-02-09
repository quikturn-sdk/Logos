/**
 * @quikturn/logos SDK -- Shared Abort-Aware Delay
 *
 * Promise-based delay utility used by the browser fetcher and scrape poller.
 * Supports an optional AbortSignal to reject early when the caller cancels
 * the operation.
 */

import { LogoError } from "../errors";

/**
 * Promise-based delay that respects an optional `AbortSignal`.
 *
 * Resolves after `ms` milliseconds unless the signal is aborted first,
 * in which case the returned promise rejects with a `LogoError`.
 *
 * If the signal is already aborted at call time, rejects immediately
 * without scheduling a timer.
 *
 * @param ms     - Delay duration in milliseconds.
 * @param signal - Optional `AbortSignal` to cancel the delay early.
 * @returns A promise that resolves after the delay or rejects on abort.
 * @throws {LogoError} With code `ABORT_ERROR` if the signal is aborted.
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
