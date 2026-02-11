import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { browserFetch } from "../../src/client/fetcher";
import {
  LogoError,
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  QuotaExceededError,
} from "../../src/errors";

// ---------------------------------------------------------------------------
// Phase 4A - Browser Fetcher (TDD)
//
// All tests mock globalThis.fetch via vi.fn(). Tests for retry delays use
// Vitest fake timers so we can advance time without actually waiting.
// ---------------------------------------------------------------------------

/**
 * Helper: creates a minimal mock Response with the given status, headers, and
 * optional body text. The `.text()` method returns the body as a resolved
 * Promise, matching the real Response API.
 */
function mockResponse(
  status: number,
  headers: Record<string, string> = {},
  body = "",
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: () => Promise.resolve(body),
    clone: () => mockResponse(status, headers, body),
  } as unknown as Response;
}

describe("browserFetch", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Success (T4.1)
  // -----------------------------------------------------------------------

  it("T4.1 - successful 200 response returns Response object", async () => {
    const res = mockResponse(200, { "Content-Type": "image/png" });
    fetchSpy.mockResolvedValueOnce(res);

    const result = await browserFetch("https://logos.getquikturn.io/github.com");

    expect(result).toBe(res);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  // -----------------------------------------------------------------------
  // Authentication errors (T4.2)
  // -----------------------------------------------------------------------

  it("T4.2 - 401 response throws AuthenticationError", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(401));

    await expect(
      browserFetch("https://logos.getquikturn.io/github.com"),
    ).rejects.toThrow(AuthenticationError);
  });

  // -----------------------------------------------------------------------
  // Forbidden errors (T4.3)
  // -----------------------------------------------------------------------

  it("T4.3 - 403 response throws ForbiddenError with body as reason", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockResponse(403, {}, "tier_too_low"),
    );

    await expect(
      browserFetch("https://logos.getquikturn.io/github.com"),
    ).rejects.toSatisfy((err: ForbiddenError) => {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.reason).toBe("tier_too_low");
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // Not Found errors (T4.4)
  // -----------------------------------------------------------------------

  it("T4.4 - 404 response throws NotFoundError", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(404));

    await expect(
      browserFetch("https://logos.getquikturn.io/unknown-domain.com"),
    ).rejects.toSatisfy((err: NotFoundError) => {
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.domain).toBe("unknown-domain.com");
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // Rate limit retry (T4.5)
  // -----------------------------------------------------------------------

  it("T4.5 - 429 response: waits Retry-After seconds, then retries", async () => {
    vi.useFakeTimers();

    const rateLimitResponse = mockResponse(429, {
      "Retry-After": "2",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1700000060",
    });
    const successResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchSpy
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = browserFetch("https://logos.getquikturn.io/github.com", {
      maxRetries: 2,
    });

    // First call happens immediately, returns 429
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Advance past the 2-second Retry-After delay
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;
    expect(result).toBe(successResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Rate limit exhaustion (T4.6)
  // -----------------------------------------------------------------------

  it("T4.6 - 429 response: respects maxRetries limit, throws RateLimitError after exhaustion", async () => {
    vi.useFakeTimers();

    const rateLimitResponse = mockResponse(429, {
      "Retry-After": "1",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1700000060",
    });

    fetchSpy.mockResolvedValue(rateLimitResponse);

    const promise = browserFetch("https://logos.getquikturn.io/github.com", {
      maxRetries: 2,
    });

    // Attach the rejection handler early so the promise rejection is tracked
    const assertion = expect(promise).rejects.toThrow(RateLimitError);

    // Initial call + 2 retries = 3 total (advance enough for all retries)
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);

    await assertion;
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Rate limit default Retry-After (T4.7)
  // -----------------------------------------------------------------------

  it("T4.7 - 429 response: defaults to 60s Retry-After if header missing", async () => {
    vi.useFakeTimers();

    const rateLimitResponse = mockResponse(429, {
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1700000060",
    });
    const successResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchSpy
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);

    const promise = browserFetch("https://logos.getquikturn.io/github.com", {
      maxRetries: 2,
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Should wait 60 seconds (default)
    await vi.advanceTimersByTimeAsync(59_999);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);

    const result = await promise;
    expect(result).toBe(successResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Quota exceeded (T4.8)
  // -----------------------------------------------------------------------

  it("T4.8 - 429 with X-Quota-Limit header throws QuotaExceededError (not RateLimitError)", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockResponse(429, {
        "Retry-After": "3600",
        "X-Quota-Limit": "500000",
        "X-Quota-Remaining": "0",
      }),
    );

    await expect(
      browserFetch("https://logos.getquikturn.io/github.com"),
    ).rejects.toSatisfy((err: QuotaExceededError) => {
      expect(err).toBeInstanceOf(QuotaExceededError);
      expect(err).not.toBeInstanceOf(RateLimitError);
      expect(err.limit).toBe(500000);
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // Server error retry (T4.9)
  // -----------------------------------------------------------------------

  it("T4.9 - 500 response: retries once, then throws LogoError", async () => {
    vi.useFakeTimers();

    const serverError = mockResponse(500, {}, "Internal Server Error");
    fetchSpy.mockResolvedValue(serverError);

    const promise = browserFetch("https://logos.getquikturn.io/github.com");

    // Attach the rejection handler early so the promise rejection is tracked
    const assertion = expect(promise).rejects.toSatisfy((err: LogoError) => {
      expect(err).toBeInstanceOf(LogoError);
      expect(err.code).toBe("SERVER_ERROR");
      expect(err.status).toBe(500);
      return true;
    });

    // Initial call
    await vi.advanceTimersByTimeAsync(0);
    // Retry delay (1 second for server errors)
    await vi.advanceTimersByTimeAsync(1000);

    await assertion;

    // Initial + 1 retry = 2 total
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // TR.1b - 429 with excessively large Retry-After is capped to 300 seconds
  // -----------------------------------------------------------------------

  it("TR.1b - 429 with excessively large Retry-After is capped to 300 seconds", async () => {
    vi.useFakeTimers();
    fetchSpy
      .mockResolvedValueOnce(mockResponse(429, { "Retry-After": "999999", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1700000060" }))
      .mockResolvedValueOnce(mockResponse(200));
    const promise = browserFetch("https://logos.getquikturn.io/x", { maxRetries: 1 });
    await vi.advanceTimersByTimeAsync(300_000);
    await promise;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // AbortSignal: abort in-flight (T4.10)
  // -----------------------------------------------------------------------

  it("T4.10 - AbortSignal: aborts in-flight request", async () => {
    const controller = new AbortController();

    fetchSpy.mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), {
        name: "AbortError",
      }),
    );

    controller.abort();

    await expect(
      browserFetch("https://logos.getquikturn.io/github.com", {
        signal: controller.signal,
      }),
    ).rejects.toSatisfy((err: LogoError) => {
      expect(err).toBeInstanceOf(LogoError);
      expect(err.code).toBe("ABORT_ERROR");
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // AbortSignal: no retry after abort (T4.11)
  // -----------------------------------------------------------------------

  it("T4.11 - AbortSignal: does not retry after abort", async () => {
    fetchSpy.mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), {
        name: "AbortError",
      }),
    );

    await expect(
      browserFetch("https://logos.getquikturn.io/github.com", {
        maxRetries: 2,
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow(LogoError);

    // Should NOT retry on abort
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Network error (T4.12)
  // -----------------------------------------------------------------------

  it("T4.12 - network error throws LogoError with descriptive message", async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(
      browserFetch("https://logos.getquikturn.io/github.com"),
    ).rejects.toSatisfy((err: LogoError) => {
      expect(err).toBeInstanceOf(LogoError);
      expect(err.code).toBe("NETWORK_ERROR");
      expect(err.message).toContain("Failed to fetch");
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // Accept header (T4.13)
  // -----------------------------------------------------------------------

  it("T4.13 - includes correct Accept header based on requested format", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(200));

    await browserFetch("https://logos.getquikturn.io/github.com", {
      format: "image/webp",
    });

    const callArgs = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(callArgs[1].headers as HeadersInit);
    expect(headers.get("Accept")).toBe("image/webp");
  });

  // -----------------------------------------------------------------------
  // No Authorization header (T4.14)
  // -----------------------------------------------------------------------

  it("T4.14 - does NOT include Authorization header", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(200));

    await browserFetch("https://logos.getquikturn.io/github.com");

    const callArgs = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(callArgs[1].headers as HeadersInit);
    expect(headers.get("Authorization")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Rate limit warning (T4.15)
  // -----------------------------------------------------------------------

  it("T4.15 - emits rateLimitWarning when remaining < 10% of tier limit", async () => {
    const onRateLimitWarning = vi.fn();

    fetchSpy.mockResolvedValueOnce(
      mockResponse(200, {
        "X-RateLimit-Remaining": "4",
        "X-RateLimit-Limit": "100",
      }),
    );

    await browserFetch("https://logos.getquikturn.io/github.com", {
      onRateLimitWarning,
    });

    expect(onRateLimitWarning).toHaveBeenCalledWith(4, 100);
  });

  // -----------------------------------------------------------------------
  // Quota warning (T4.16)
  // -----------------------------------------------------------------------

  it("T4.16 - emits quotaWarning when quota remaining < 10% of tier limit", async () => {
    const onQuotaWarning = vi.fn();

    fetchSpy.mockResolvedValueOnce(
      mockResponse(200, {
        "X-Quota-Remaining": "40000",
        "X-Quota-Limit": "500000",
      }),
    );

    await browserFetch("https://logos.getquikturn.io/github.com", {
      onQuotaWarning,
    });

    expect(onQuotaWarning).toHaveBeenCalledWith(40000, 500000);
  });

  // -----------------------------------------------------------------------
  // Bad Request (T4.R1)
  // -----------------------------------------------------------------------

  it("T4.R1 - 400 response throws BadRequestError", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(400, {}, "Invalid domain format"));
    await expect(browserFetch("https://logos.getquikturn.io/x")).rejects.toThrow(BadRequestError);
  });

  // -----------------------------------------------------------------------
  // Unexpected status codes (T4.R2)
  // -----------------------------------------------------------------------

  it("T4.R2 - 502 response throws LogoError with UNEXPECTED_ERROR code", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(502, {}, "Bad Gateway"));
    await expect(browserFetch("https://logos.getquikturn.io/x")).rejects.toThrow(LogoError);
    fetchSpy.mockResolvedValueOnce(mockResponse(502, {}, "Bad Gateway"));
    try {
      await browserFetch("https://logos.getquikturn.io/x");
    } catch (err) {
      expect((err as LogoError).code).toBe("UNEXPECTED_ERROR");
      expect((err as LogoError).status).toBe(502);
    }
  });

  // -----------------------------------------------------------------------
  // maxRetries: 0 on 429 (T4.R3)
  // -----------------------------------------------------------------------

  it("T4.R3 - 429 with maxRetries: 0 throws RateLimitError immediately", async () => {
    fetchSpy.mockResolvedValue(mockResponse(429, { "Retry-After": "5", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1700000060" }));
    await expect(browserFetch("https://logos.getquikturn.io/x", { maxRetries: 0 })).rejects.toThrow(RateLimitError);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // No retry
  });

  // -----------------------------------------------------------------------
  // Warning at exact 10% boundary (T4.R4)
  // -----------------------------------------------------------------------

  it("T4.R4 - Rate limit warning does NOT fire at exactly 10% remaining", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(200, {
      "X-RateLimit-Remaining": "10",
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Reset": "1700000060",
      "X-Quota-Remaining": "50000",
      "X-Quota-Limit": "500000",
    }));
    const onRateLimitWarning = vi.fn();
    await browserFetch("https://logos.getquikturn.io/x", { onRateLimitWarning });
    expect(onRateLimitWarning).not.toHaveBeenCalled(); // 10/100 = 10%, not < 10%
  });

  // -----------------------------------------------------------------------
  // Retry-After: 0 floor (T4.R5)
  // -----------------------------------------------------------------------

  it("T4.R5 - 429 with Retry-After: 0 floors to 1 second delay", async () => {
    vi.useFakeTimers();
    fetchSpy
      .mockResolvedValueOnce(mockResponse(429, { "Retry-After": "0", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1700000060" }))
      .mockResolvedValueOnce(mockResponse(200));
    const promise = browserFetch("https://logos.getquikturn.io/x");
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
