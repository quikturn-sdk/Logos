import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { handleScrapeResponse } from "../../src/client/scrape-poller";
import { LogoError, ScrapeTimeoutError } from "../../src/errors";
import type { ScrapeProgressEvent, ScrapePendingResponse } from "../../src/types";
import type { browserFetch } from "../../src/client/fetcher";

// ---------------------------------------------------------------------------
// Phase 4B - Scrape Poller (TDD)
//
// All tests mock the fetchFn (browserFetch signature) via vi.fn(). Tests for
// polling delays and timeouts use Vitest fake timers so we can advance time
// without actually waiting.
// ---------------------------------------------------------------------------

/**
 * Helper: creates a minimal mock Response with the given status, headers, and
 * optional body. Supports both text() and json() methods on the mock.
 */
function mockResponse(
  status: number,
  headers: Record<string, string> = {},
  body: unknown = "",
): Response {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: () => Promise.resolve(bodyStr),
    json: () => Promise.resolve(typeof body === "string" ? JSON.parse(body) : body),
    clone: () => mockResponse(status, headers, body),
  } as unknown as Response;
}

/**
 * Helper: builds a 202 response with a valid ScrapePendingResponse JSON body.
 */
function mock202Response(overrides: Partial<ScrapePendingResponse> = {}): Response {
  const body: ScrapePendingResponse = {
    status: "scrape_pending",
    message: "Scraping logo for example.com",
    companyId: 42,
    companyName: "Example Inc",
    scrapeJob: {
      jobId: "job-abc-123",
      pollUrl: "https://logos.getquikturn.io/scrape/status/job-abc-123",
      estimatedWaitMs: 1000,
    },
    ...overrides,
  };
  return mockResponse(202, { "Content-Type": "application/json" }, body);
}

/**
 * Helper: builds a poll progress response for a given status.
 */
function mockPollResponse(event: ScrapeProgressEvent): Response {
  return mockResponse(200, { "Content-Type": "application/json" }, event);
}

describe("handleScrapeResponse", () => {
  let fetchFn: ReturnType<typeof vi.fn<typeof browserFetch>>;

  beforeEach(() => {
    fetchFn = vi.fn<typeof browserFetch>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Passthrough for non-202 (T4.17)
  // -----------------------------------------------------------------------

  it("T4.17 - non-202 response returns immediately (passthrough)", async () => {
    const res = mockResponse(200, { "Content-Type": "image/png" });

    const result = await handleScrapeResponse(
      res,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
    );

    expect(result).toBe(res);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 202 parsing (T4.18)
  // -----------------------------------------------------------------------

  it("T4.18 - 202 response: parses scrapeJob from JSON body", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();
    const onScrapeProgress = vi.fn();

    // First poll returns complete
    const completePoll = mockPollResponse({
      status: "complete",
      progress: 100,
      logo: { id: 1, url: "https://cdn.example.com/logo.png", companyId: 42, companyName: "Example Inc" },
    });
    const finalResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchFn
      .mockResolvedValueOnce(completePoll)   // poll
      .mockResolvedValueOnce(finalResponse);  // final fetch

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { onScrapeProgress },
    );

    // Advance past estimatedWaitMs (1000ms)
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toBe(finalResponse);

    // Verify the poll URL was called correctly
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const pollCallUrl = fetchFn.mock.calls[0]![0];
    expect(pollCallUrl).toBe("https://logos.getquikturn.io/scrape/status/job-abc-123");
  });

  // -----------------------------------------------------------------------
  // Full polling cycle (T4.19)
  // -----------------------------------------------------------------------

  it("T4.19 - polls pollUrl until status === 'complete', then fetches final logo", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();

    const pendingPoll = mockPollResponse({ status: "pending", progress: 30 });
    const completePoll = mockPollResponse({
      status: "complete",
      progress: 100,
      logo: { id: 1, url: "https://cdn.example.com/logo.png", companyId: 42, companyName: "Example Inc" },
    });
    const finalResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchFn
      .mockResolvedValueOnce(pendingPoll)    // 1st poll: pending
      .mockResolvedValueOnce(completePoll)   // 2nd poll: complete
      .mockResolvedValueOnce(finalResponse); // final fetch

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
    );

    // First poll at estimatedWaitMs (1000ms)
    await vi.advanceTimersByTimeAsync(1000);
    // Second poll at 2000ms backoff (doubled)
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;
    expect(result).toBe(finalResponse);
    expect(fetchFn).toHaveBeenCalledTimes(3); // 2 polls + 1 final fetch
  });

  // -----------------------------------------------------------------------
  // Exponential backoff (T4.20)
  // -----------------------------------------------------------------------

  it("T4.20 - polling uses exponential backoff starting from estimatedWaitMs", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response({
      scrapeJob: {
        jobId: "job-abc-123",
        pollUrl: "https://logos.getquikturn.io/scrape/status/job-abc-123",
        estimatedWaitMs: 500,
      },
    });

    const pendingPoll = mockPollResponse({ status: "pending", progress: 10 });
    const completePoll = mockPollResponse({
      status: "complete",
      progress: 100,
      logo: { id: 1, url: "https://cdn.example.com/logo.png", companyId: 42, companyName: "Example Inc" },
    });
    const finalResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchFn
      .mockResolvedValueOnce(pendingPoll)    // 1st poll after 500ms
      .mockResolvedValueOnce(pendingPoll)    // 2nd poll after 1000ms
      .mockResolvedValueOnce(pendingPoll)    // 3rd poll after 2000ms
      .mockResolvedValueOnce(completePoll)   // 4th poll after 4000ms
      .mockResolvedValueOnce(finalResponse); // final fetch

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { scrapeTimeout: 60_000 }, // large timeout so we don't hit it
    );

    // Poll 1: after 500ms (initial estimatedWaitMs)
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Poll 2: after 1000ms (500 * 2)
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    // Poll 3: after 2000ms (1000 * 2)
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchFn).toHaveBeenCalledTimes(3);

    // Poll 4: after 4000ms (2000 * 2) -- completes, which triggers final fetch
    await vi.advanceTimersByTimeAsync(4000);

    const result = await promise;
    expect(result).toBe(finalResponse);
    // 4 polls + 1 final fetch = 5 total calls
    expect(fetchFn).toHaveBeenCalledTimes(5);
  });

  // -----------------------------------------------------------------------
  // onScrapeProgress callback (T4.21)
  // -----------------------------------------------------------------------

  it("T4.21 - calls onScrapeProgress callback on each poll", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();
    const onScrapeProgress = vi.fn();

    const pendingEvent: ScrapeProgressEvent = { status: "pending", progress: 50 };
    const completeEvent: ScrapeProgressEvent = {
      status: "complete",
      progress: 100,
      logo: { id: 1, url: "https://cdn.example.com/logo.png", companyId: 42, companyName: "Example Inc" },
    };

    fetchFn
      .mockResolvedValueOnce(mockPollResponse(pendingEvent))
      .mockResolvedValueOnce(mockPollResponse(completeEvent))
      .mockResolvedValueOnce(mockResponse(200, { "Content-Type": "image/png" }));

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { onScrapeProgress },
    );

    // First poll
    await vi.advanceTimersByTimeAsync(1000);
    expect(onScrapeProgress).toHaveBeenCalledTimes(1);
    expect(onScrapeProgress).toHaveBeenCalledWith(pendingEvent);

    // Second poll
    await vi.advanceTimersByTimeAsync(2000);

    await promise;
    expect(onScrapeProgress).toHaveBeenCalledTimes(2);
    expect(onScrapeProgress).toHaveBeenLastCalledWith(completeEvent);
  });

  // -----------------------------------------------------------------------
  // Timeout (T4.22)
  // -----------------------------------------------------------------------

  it("T4.22 - rejects with ScrapeTimeoutError after scrapeTimeout (default 30s)", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();
    const pendingPoll = mockPollResponse({ status: "pending", progress: 10 });

    // Always return pending
    fetchFn.mockResolvedValue(pendingPoll);

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
    );

    const assertion = expect(promise).rejects.toSatisfy((err: ScrapeTimeoutError) => {
      expect(err).toBeInstanceOf(ScrapeTimeoutError);
      expect(err.jobId).toBe("job-abc-123");
      expect(err.elapsed).toBeGreaterThanOrEqual(30_000);
      return true;
    });

    // Advance well past 30 seconds to exhaust all polls
    await vi.advanceTimersByTimeAsync(60_000);

    await assertion;
  });

  // -----------------------------------------------------------------------
  // Custom timeout (T4.23)
  // -----------------------------------------------------------------------

  it("T4.23 - custom scrapeTimeout overrides default", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response({
      scrapeJob: {
        jobId: "job-custom",
        pollUrl: "https://logos.getquikturn.io/scrape/status/job-custom",
        estimatedWaitMs: 500,
      },
    });
    const pendingPoll = mockPollResponse({ status: "pending", progress: 10 });

    fetchFn.mockResolvedValue(pendingPoll);

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { scrapeTimeout: 5000 },
    );

    const assertion = expect(promise).rejects.toSatisfy((err: ScrapeTimeoutError) => {
      expect(err).toBeInstanceOf(ScrapeTimeoutError);
      expect(err.jobId).toBe("job-custom");
      expect(err.elapsed).toBeGreaterThanOrEqual(5000);
      return true;
    });

    // Advance past the 5-second custom timeout
    await vi.advanceTimersByTimeAsync(15_000);

    await assertion;
  });

  // -----------------------------------------------------------------------
  // Poll network error retries (T4.24)
  // -----------------------------------------------------------------------

  it("T4.24 - poll failure (network error): retries up to 3 times", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();
    const networkError = new LogoError("Network error: Failed to fetch", "NETWORK_ERROR");

    const completePoll = mockPollResponse({
      status: "complete",
      progress: 100,
      logo: { id: 1, url: "https://cdn.example.com/logo.png", companyId: 42, companyName: "Example Inc" },
    });
    const finalResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchFn
      .mockRejectedValueOnce(networkError)    // 1st attempt: fails
      .mockRejectedValueOnce(networkError)    // 2nd attempt: fails
      .mockResolvedValueOnce(completePoll)    // 3rd attempt: succeeds
      .mockResolvedValueOnce(finalResponse);  // final fetch

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { scrapeTimeout: 60_000 },
    );

    // Advance through all the delays
    await vi.advanceTimersByTimeAsync(60_000);

    const result = await promise;
    expect(result).toBe(finalResponse);
  });

  // -----------------------------------------------------------------------
  // Poll returns "failed" (T4.25)
  // -----------------------------------------------------------------------

  it("T4.25 - poll returns status 'failed': rejects with LogoError including error message", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();
    const failedPoll = mockPollResponse({
      status: "failed",
      error: "Domain is unreachable",
    });

    fetchFn.mockResolvedValueOnce(failedPoll);

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
    );

    const assertion = expect(promise).rejects.toSatisfy((err: LogoError) => {
      expect(err).toBeInstanceOf(LogoError);
      expect(err.code).toBe("SCRAPE_FAILED");
      expect(err.message).toContain("Domain is unreachable");
      return true;
    });

    await vi.advanceTimersByTimeAsync(1000);

    await assertion;
  });

  // -----------------------------------------------------------------------
  // AbortSignal cancels polling (T4.26)
  // -----------------------------------------------------------------------

  it("T4.26 - AbortSignal cancels polling", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();
    const controller = new AbortController();

    const pendingPoll = mockPollResponse({ status: "pending", progress: 10 });
    fetchFn.mockResolvedValue(pendingPoll);

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { signal: controller.signal, scrapeTimeout: 60_000 },
    );

    const assertion = expect(promise).rejects.toSatisfy((err: LogoError) => {
      expect(err).toBeInstanceOf(LogoError);
      expect(err.code).toBe("ABORT_ERROR");
      return true;
    });

    // Let the first poll happen
    await vi.advanceTimersByTimeAsync(1000);

    // Abort during the delay before the next poll
    controller.abort();
    await vi.advanceTimersByTimeAsync(1);

    await assertion;
  });

  // -----------------------------------------------------------------------
  // Malformed 202 JSON body (T4.R6)
  // -----------------------------------------------------------------------

  it("T4.R6 - Malformed 202 JSON body throws LogoError with SCRAPE_PARSE_ERROR", async () => {
    const response = {
      status: 202,
      ok: false,
      headers: new Headers(),
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
      text: () => Promise.resolve("not json"),
      clone: () => response,
    } as unknown as Response;

    await expect(
      handleScrapeResponse(response, "https://logos.getquikturn.io/test.com", fetchFn),
    ).rejects.toThrow(LogoError);

    try {
      await handleScrapeResponse(response, "https://logos.getquikturn.io/test.com", fetchFn);
    } catch (err: unknown) {
      expect((err as LogoError).code).toBe("SCRAPE_PARSE_ERROR");
    }
  });

  // -----------------------------------------------------------------------
  // Backoff caps at MAX_BACKOFF_MS (T4.R7)
  // -----------------------------------------------------------------------

  it("T4.R7 - backoff caps at MAX_BACKOFF_MS (5000ms)", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response({
      scrapeJob: {
        jobId: "job-cap",
        pollUrl: "https://logos.getquikturn.io/scrape/status/job-cap",
        estimatedWaitMs: 3000,
      },
    });

    const pendingPoll = mockPollResponse({ status: "pending", progress: 10 });
    const completePoll = mockPollResponse({
      status: "complete",
      progress: 100,
      logo: { id: 1, url: "https://cdn.example.com/logo.png", companyId: 42, companyName: "Example Inc" },
    });
    const finalResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchFn
      .mockResolvedValueOnce(pendingPoll)    // 1st poll after 3000ms
      .mockResolvedValueOnce(pendingPoll)    // 2nd poll after 5000ms (6000 capped to 5000)
      .mockResolvedValueOnce(completePoll)   // 3rd poll after 5000ms (still capped)
      .mockResolvedValueOnce(finalResponse); // final fetch

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { scrapeTimeout: 60_000 },
    );

    // Poll 1: after 3000ms (initial estimatedWaitMs)
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Poll 2: after 5000ms (3000 * 2 = 6000, capped to 5000)
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    // Poll 3: after 5000ms (still capped at 5000)
    await vi.advanceTimersByTimeAsync(5000);

    const result = await promise;
    expect(result).toBe(finalResponse);
    // 3 polls + 1 final fetch = 4 total calls
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });

  // -----------------------------------------------------------------------
  // pollUrl origin mismatch (T4.R8)
  // -----------------------------------------------------------------------

  it("T4.R8 - pollUrl with different origin throws SCRAPE_PARSE_ERROR", async () => {
    const response = mock202Response({
      scrapeJob: {
        jobId: "j1",
        pollUrl: "https://evil.com/poll/j1",
        estimatedWaitMs: 1000,
      },
    });

    await expect(
      handleScrapeResponse(response, "https://logos.getquikturn.io/test.com", fetchFn),
    ).rejects.toThrow(LogoError);

    try {
      await handleScrapeResponse(
        mock202Response({
          scrapeJob: {
            jobId: "j1",
            pollUrl: "https://evil.com/poll/j1",
            estimatedWaitMs: 1000,
          },
        }),
        "https://logos.getquikturn.io/test.com",
        fetchFn,
      );
    } catch (err: unknown) {
      expect((err as LogoError).code).toBe("SCRAPE_PARSE_ERROR");
    }
  });

  // -----------------------------------------------------------------------
  // Token passed to final fetch (T4.27)
  // -----------------------------------------------------------------------

  it("T4.27 - correctly passes token for the final logo fetch after scrape completes", async () => {
    vi.useFakeTimers();

    const response202 = mock202Response();
    const completePoll = mockPollResponse({
      status: "complete",
      progress: 100,
      logo: { id: 1, url: "https://cdn.example.com/logo.png", companyId: 42, companyName: "Example Inc" },
    });
    const finalResponse = mockResponse(200, { "Content-Type": "image/png" });

    fetchFn
      .mockResolvedValueOnce(completePoll)
      .mockResolvedValueOnce(finalResponse);

    const promise = handleScrapeResponse(
      response202,
      "https://logos.getquikturn.io/example.com",
      fetchFn,
      { token: "qt_test_token_123" },
    );

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;
    expect(result).toBe(finalResponse);

    // Verify the final fetch included the token
    const finalFetchUrl = fetchFn.mock.calls[1]![0];
    expect(finalFetchUrl).toContain("token=qt_test_token_123");
  });
});
