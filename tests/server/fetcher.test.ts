import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { serverFetch } from "../../src/server/fetcher";
import {
  LogoError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  QuotaExceededError,
} from "../../src/errors";

// ---------------------------------------------------------------------------
// Phase 5A - Server Fetcher (TDD)
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
    json: () => Promise.resolve(JSON.parse(body || "{}")),
    body: null,
    clone: () => mockResponse(status, headers, body),
  } as unknown as Response;
}

describe("serverFetch", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  const TEST_URL = "https://logos.getquikturn.io/github.com";
  const TEST_TOKEN = "sk_test_abc123";

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // T5.1 - Authorization: Bearer header
  // -----------------------------------------------------------------------

  it("T5.1 - includes Authorization: Bearer {sk_key} header", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(200));

    await serverFetch(TEST_URL, { token: TEST_TOKEN });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const callArgs = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(callArgs[1].headers as HeadersInit);
    expect(headers.get("Authorization")).toBe(`Bearer ${TEST_TOKEN}`);
  });

  // -----------------------------------------------------------------------
  // T5.2 - Token NOT in URL query string
  // -----------------------------------------------------------------------

  it("T5.2 - does NOT include token in URL query string", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(200));

    await serverFetch(TEST_URL, { token: TEST_TOKEN });

    const callArgs = fetchSpy.mock.calls[0] as [string, RequestInit];
    const requestUrl = callArgs[0];
    expect(requestUrl).not.toContain(TEST_TOKEN);
    expect(requestUrl).not.toContain("token=");
  });

  // -----------------------------------------------------------------------
  // T5.3 - Successful 200 returns Response
  // -----------------------------------------------------------------------

  it("T5.3 - successful 200 returns Response object", async () => {
    const res = mockResponse(200, { "Content-Type": "image/png" });
    fetchSpy.mockResolvedValueOnce(res);

    const result = await serverFetch(TEST_URL, { token: TEST_TOKEN });

    expect(result).toBe(res);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  // -----------------------------------------------------------------------
  // T5.4 - 401 throws AuthenticationError
  // -----------------------------------------------------------------------

  it("T5.4 - 401 response throws AuthenticationError", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(401));

    await expect(
      serverFetch(TEST_URL, { token: TEST_TOKEN }),
    ).rejects.toThrow(AuthenticationError);
  });

  // -----------------------------------------------------------------------
  // T5.5 - 403 throws ForbiddenError
  // -----------------------------------------------------------------------

  it("T5.5 - 403 response throws ForbiddenError with body as reason", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(403, {}, "tier_too_low"));

    await expect(
      serverFetch(TEST_URL, { token: TEST_TOKEN }),
    ).rejects.toSatisfy((err: ForbiddenError) => {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.reason).toBe("tier_too_low");
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // T5.6 - 404 throws NotFoundError
  // -----------------------------------------------------------------------

  it("T5.6 - 404 response throws NotFoundError with domain", async () => {
    fetchSpy.mockResolvedValueOnce(mockResponse(404));

    await expect(
      serverFetch(TEST_URL, { token: TEST_TOKEN }),
    ).rejects.toSatisfy((err: NotFoundError) => {
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.domain).toBe("github.com");
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // T5.7 - 429 retry with Retry-After backoff
  // -----------------------------------------------------------------------

  it("T5.7 - 429 response: waits Retry-After seconds, then retries", async () => {
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

    const promise = serverFetch(TEST_URL, {
      token: TEST_TOKEN,
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
  // T5.8 - 429 quota detection via X-Quota-* headers
  // -----------------------------------------------------------------------

  it("T5.8 - 429 with X-Quota-Limit header throws QuotaExceededError", async () => {
    fetchSpy.mockResolvedValueOnce(
      mockResponse(429, {
        "Retry-After": "3600",
        "X-Quota-Limit": "500000",
        "X-Quota-Remaining": "0",
      }),
    );

    await expect(
      serverFetch(TEST_URL, { token: TEST_TOKEN }),
    ).rejects.toSatisfy((err: QuotaExceededError) => {
      expect(err).toBeInstanceOf(QuotaExceededError);
      expect(err).not.toBeInstanceOf(RateLimitError);
      expect(err.limit).toBe(500000);
      expect(err.used).toBe(500000);
      expect(err.retryAfter).toBe(3600);
      return true;
    });
  });

  // -----------------------------------------------------------------------
  // T5.9 - 500 retry once + throw LogoError
  // -----------------------------------------------------------------------

  it("T5.9 - 500 response: retries once, then throws LogoError with SERVER_ERROR", async () => {
    vi.useFakeTimers();

    const serverError = mockResponse(500, {}, "Internal Server Error");
    fetchSpy.mockResolvedValue(serverError);

    const promise = serverFetch(TEST_URL, { token: TEST_TOKEN });

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
  // TR.1 - 429 with excessively large Retry-After is capped to 300 seconds
  // -----------------------------------------------------------------------

  it("TR.1 - 429 with excessively large Retry-After is capped to 300 seconds", async () => {
    vi.useFakeTimers();
    fetchSpy
      .mockResolvedValueOnce(mockResponse(429, { "Retry-After": "999999", "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": "1700000060" }))
      .mockResolvedValueOnce(mockResponse(200));
    const promise = serverFetch(TEST_URL, { token: TEST_TOKEN, maxRetries: 1 });
    // Should wait max 300 seconds (300000ms), not 999999 seconds
    await vi.advanceTimersByTimeAsync(300_000);
    await promise;
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // T5.10 - AbortSignal support
  // -----------------------------------------------------------------------

  it("T5.10 - AbortSignal: aborts request and throws LogoError with ABORT_ERROR", async () => {
    const controller = new AbortController();

    fetchSpy.mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), {
        name: "AbortError",
      }),
    );

    controller.abort();

    await expect(
      serverFetch(TEST_URL, {
        token: TEST_TOKEN,
        signal: controller.signal,
      }),
    ).rejects.toSatisfy((err: LogoError) => {
      expect(err).toBeInstanceOf(LogoError);
      expect(err.code).toBe("ABORT_ERROR");
      return true;
    });

    // Should NOT retry on abort
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // T5.11 - Streaming: returns raw Response for stream consumption
  // -----------------------------------------------------------------------

  it("T5.11 - streaming: returns raw Response with accessible body for stream consumption", async () => {
    const fakeStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
        controller.close();
      },
    });

    const streamingResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/png" }),
      text: () => Promise.resolve(""),
      json: () => Promise.resolve({}),
      body: fakeStream,
      clone: function () { return this; },
    } as unknown as Response;

    fetchSpy.mockResolvedValueOnce(streamingResponse);

    const result = await serverFetch(TEST_URL, { token: TEST_TOKEN });

    // The raw Response is returned, allowing the caller to consume `.body`
    expect(result).toBe(streamingResponse);
    expect(result.body).toBe(fakeStream);
    expect(result.body).toBeInstanceOf(ReadableStream);
  });
});
