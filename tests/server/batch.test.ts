import { describe, it, expect, vi, afterEach } from "vitest";
import { getMany } from "../../src/server/batch";
import type { BatchResult } from "../../src/server/batch";
import type { LogoMetadata } from "../../src/types";
import { RateLimitError, LogoError } from "../../src/errors";

// ---------------------------------------------------------------------------
// Phase 5B - Batch Operations (TDD)
//
// Tests for the getMany() async generator which fetches logos for multiple
// domains with concurrency control, order preservation, partial failure
// handling, rate-limit backoff, and AbortSignal support.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a default LogoMetadata fixture. */
function mockMetadata(): LogoMetadata {
  return {
    cache: { status: "MISS" },
    rateLimit: { remaining: 90, reset: new Date("2026-01-01T00:01:00Z") },
    quota: { remaining: 450_000, limit: 500_000 },
    transformation: { applied: false },
  };
}

/** Collects all results from an async generator into an array. */
async function collectResults(gen: AsyncGenerator<BatchResult>): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  for await (const result of gen) {
    results.push(result);
  }
  return results;
}

/** Creates a mock fetchFn that resolves with domain-specific Buffer data. */
function createMockFetchFn(delayMs = 0) {
  return vi.fn(async (domain: string) => {
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    return {
      buffer: Buffer.from(`logo-${domain}`),
      contentType: "image/png",
      metadata: mockMetadata(),
    };
  });
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("getMany", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // T5.12 - Basic: yields two results for two domains
  // -----------------------------------------------------------------------

  it("T5.12 - getMany(['a.com', 'b.com']) yields two results", async () => {
    const fetchFn = createMockFetchFn();
    const gen = getMany(["a.com", "b.com"], fetchFn);
    const results = await collectResults(gen);

    expect(results).toHaveLength(2);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenCalledWith("a.com");
    expect(fetchFn).toHaveBeenCalledWith("b.com");
  });

  // -----------------------------------------------------------------------
  // T5.13 - Default concurrency limit (5)
  // -----------------------------------------------------------------------

  it("T5.13 - Respects default concurrency limit of 5", async () => {
    let activeCalls = 0;
    let peakConcurrency = 0;

    const fetchFn = vi.fn(async (domain: string) => {
      activeCalls++;
      peakConcurrency = Math.max(peakConcurrency, activeCalls);
      // Small delay to allow concurrency to build up
      await new Promise(r => setTimeout(r, 50));
      activeCalls--;
      return {
        buffer: Buffer.from(`logo-${domain}`),
        contentType: "image/png",
        metadata: mockMetadata(),
      };
    });

    const domains = Array.from({ length: 10 }, (_, i) => `domain${i}.com`);
    const gen = getMany(domains, fetchFn);
    const results = await collectResults(gen);

    expect(results).toHaveLength(10);
    expect(peakConcurrency).toBeLessThanOrEqual(5);
    expect(peakConcurrency).toBeGreaterThanOrEqual(2); // sanity: at least some concurrency
  });

  // -----------------------------------------------------------------------
  // T5.14 - Custom concurrency: { concurrency: 2 }
  // -----------------------------------------------------------------------

  it("T5.14 - Custom concurrency of 2 runs max 2 at once", async () => {
    let activeCalls = 0;
    let peakConcurrency = 0;

    const fetchFn = vi.fn(async (domain: string) => {
      activeCalls++;
      peakConcurrency = Math.max(peakConcurrency, activeCalls);
      await new Promise(r => setTimeout(r, 50));
      activeCalls--;
      return {
        buffer: Buffer.from(`logo-${domain}`),
        contentType: "image/png",
        metadata: mockMetadata(),
      };
    });

    const domains = Array.from({ length: 6 }, (_, i) => `domain${i}.com`);
    const gen = getMany(domains, fetchFn, { concurrency: 2 });
    const results = await collectResults(gen);

    expect(results).toHaveLength(6);
    expect(peakConcurrency).toBeLessThanOrEqual(2);
    expect(peakConcurrency).toBeGreaterThanOrEqual(2); // exactly 2 concurrent
  });

  // -----------------------------------------------------------------------
  // T5.15 - Partial failure: successful + failed results
  // -----------------------------------------------------------------------

  it("T5.15 - Partial failure yields successful results and includes error in failed results", async () => {
    const fetchFn = vi.fn(async (domain: string) => {
      if (domain === "fail.com") {
        throw new LogoError("Not found", "NOT_FOUND_ERROR", 404);
      }
      return {
        buffer: Buffer.from(`logo-${domain}`),
        contentType: "image/png",
        metadata: mockMetadata(),
      };
    });

    const gen = getMany(["good.com", "fail.com", "also-good.com"], fetchFn);
    const results = await collectResults(gen);

    expect(results).toHaveLength(3);

    // First result: success
    expect(results[0]!.domain).toBe("good.com");
    expect(results[0]!.success).toBe(true);
    expect(results[0]!.buffer).toBeDefined();
    expect(results[0]!.error).toBeUndefined();

    // Second result: failure
    expect(results[1]!.domain).toBe("fail.com");
    expect(results[1]!.success).toBe(false);
    expect(results[1]!.error).toBeInstanceOf(LogoError);
    expect(results[1]!.error!.code).toBe("NOT_FOUND_ERROR");
    expect(results[1]!.buffer).toBeUndefined();

    // Third result: success
    expect(results[2]!.domain).toBe("also-good.com");
    expect(results[2]!.success).toBe(true);
    expect(results[2]!.buffer).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // T5.16 - Rate limit hit mid-batch: pauses and resumes
  // -----------------------------------------------------------------------

  it("T5.16 - Rate limit hit mid-batch: pauses, waits retryAfter, resumes", async () => {
    vi.useFakeTimers();

    let callCount = 0;
    const fetchFn = vi.fn(async (domain: string) => {
      callCount++;
      // First call to "b.com" throws RateLimitError, subsequent calls succeed
      if (domain === "b.com" && callCount <= 2) {
        throw new RateLimitError(
          "Rate limit exceeded",
          2, // retryAfter: 2 seconds
          0,
          new Date("2026-01-01T00:01:00Z"),
        );
      }
      return {
        buffer: Buffer.from(`logo-${domain}`),
        contentType: "image/png",
        metadata: mockMetadata(),
      };
    });

    const gen = getMany(["a.com", "b.com", "c.com"], fetchFn, { concurrency: 1 });

    // Collect results using a promise that we will resolve after advancing timers
    const resultsPromise = collectResults(gen);

    // Let microtasks and initial work proceed
    await vi.advanceTimersByTimeAsync(0);

    // Advance past the rate limit pause (2000ms)
    await vi.advanceTimersByTimeAsync(2100);

    // Advance again for the second rate limit retry pause
    await vi.advanceTimersByTimeAsync(2100);

    // Let remaining work finish
    await vi.advanceTimersByTimeAsync(100);

    const results = await resultsPromise;

    expect(results).toHaveLength(3);
    // All results should eventually succeed (after retry)
    expect(results[0]!.domain).toBe("a.com");
    expect(results[0]!.success).toBe(true);
    expect(results[1]!.domain).toBe("b.com");
    expect(results[1]!.success).toBe(true);
    expect(results[2]!.domain).toBe("c.com");
    expect(results[2]!.success).toBe(true);

    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // TR.3 - processDomain stops retrying after MAX_RATE_LIMIT_RETRIES
  // -----------------------------------------------------------------------

  it("TR.3 - processDomain stops retrying after MAX_RATE_LIMIT_RETRIES rate limit errors", async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn(async () => {
      throw new RateLimitError("Rate limit exceeded", 1, 0, new Date("2026-01-01T00:01:00Z"));
    });
    const gen = getMany(["a.com"], fetchFn, { concurrency: 1 });
    const resultsPromise = collectResults(gen);
    // Advance timers enough for all retries (each waits 1000ms)
    await vi.advanceTimersByTimeAsync(10_000);
    const results = await resultsPromise;
    expect(results).toHaveLength(1);
    expect(results[0]!.success).toBe(false);
    expect(results[0]!.error).toBeInstanceOf(RateLimitError);
    // Should have been called 4 times: initial + 3 retries
    expect(fetchFn).toHaveBeenCalledTimes(4);
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // T5.17 - AbortSignal cancels remaining batch items
  // -----------------------------------------------------------------------

  it("T5.17 - AbortSignal cancels remaining batch items", async () => {
    const controller = new AbortController();
    let fetchCallCount = 0;

    const fetchFn = vi.fn(async (domain: string) => {
      fetchCallCount++;
      // Abort after the first domain is fetched
      if (fetchCallCount === 1) {
        controller.abort();
      }
      return {
        buffer: Buffer.from(`logo-${domain}`),
        contentType: "image/png",
        metadata: mockMetadata(),
      };
    });

    const domains = ["first.com", "second.com", "third.com", "fourth.com"];
    const gen = getMany(domains, fetchFn, { signal: controller.signal, concurrency: 1 });
    const results = await collectResults(gen);

    // Only the first domain should have been fetched; the rest were cancelled
    expect(fetchCallCount).toBe(1);
    expect(results).toHaveLength(1);
    expect(results[0]!.domain).toBe("first.com");
    expect(results[0]!.success).toBe(true);
  });

  // -----------------------------------------------------------------------
  // T5.18 - Empty array yields zero results
  // -----------------------------------------------------------------------

  it("T5.18 - Empty array yields zero results", async () => {
    const fetchFn = createMockFetchFn();
    const gen = getMany([], fetchFn);
    const results = await collectResults(gen);

    expect(results).toHaveLength(0);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // T5.19 - Result shape: domain, buffer, contentType, metadata (or error)
  // -----------------------------------------------------------------------

  it("T5.19 - Each yielded result includes domain, buffer, contentType, metadata (or error)", async () => {
    const fetchFn = vi.fn(async (domain: string) => {
      if (domain === "err.com") {
        throw new LogoError("Server error", "SERVER_ERROR", 500);
      }
      return {
        buffer: Buffer.from(`logo-${domain}`),
        contentType: "image/webp",
        metadata: mockMetadata(),
      };
    });

    const gen = getMany(["ok.com", "err.com"], fetchFn);
    const results = await collectResults(gen);

    // Successful result shape
    const ok = results[0]!;
    expect(ok.domain).toBe("ok.com");
    expect(ok.success).toBe(true);
    expect(ok.buffer).toBeInstanceOf(Buffer);
    expect(ok.buffer!.toString()).toBe("logo-ok.com");
    expect(ok.contentType).toBe("image/webp");
    expect(ok.metadata).toBeDefined();
    expect(ok.metadata!.cache.status).toBe("MISS");
    expect(ok.metadata!.rateLimit.remaining).toBe(90);
    expect(ok.metadata!.quota.remaining).toBe(450_000);
    expect(ok.error).toBeUndefined();

    // Failed result shape
    const err = results[1]!;
    expect(err.domain).toBe("err.com");
    expect(err.success).toBe(false);
    expect(err.error).toBeInstanceOf(LogoError);
    expect(err.error!.code).toBe("SERVER_ERROR");
    expect(err.buffer).toBeUndefined();
    expect(err.contentType).toBeUndefined();
    expect(err.metadata).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // T5.20 - Order: results match input order regardless of completion order
  // -----------------------------------------------------------------------

  it("T5.20 - Maintains order of results matching input order", async () => {
    // Domains with varying delays to ensure they complete out of order
    const delays: Record<string, number> = {
      "c.com": 100,   // slowest
      "a.com": 10,    // fastest
      "b.com": 50,    // middle
    };

    const fetchFn = vi.fn(async (domain: string) => {
      const ms = delays[domain] ?? 0;
      await new Promise(r => setTimeout(r, ms));
      return {
        buffer: Buffer.from(`logo-${domain}`),
        contentType: "image/png",
        metadata: mockMetadata(),
      };
    });

    const gen = getMany(["c.com", "a.com", "b.com"], fetchFn, { concurrency: 3 });
    const results = await collectResults(gen);

    expect(results).toHaveLength(3);
    // Results must be in the same order as the input domains, not completion order
    expect(results[0]!.domain).toBe("c.com");
    expect(results[1]!.domain).toBe("a.com");
    expect(results[2]!.domain).toBe("b.com");
  });
});
