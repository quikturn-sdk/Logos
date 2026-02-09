import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { LogoMetadata, ScrapeProgressEvent } from "../../src/types";

// ---------------------------------------------------------------------------
// Phase 4D - Browser Client Class (TDD)
//
// Tests mock the internal dependency modules (fetcher, scrape-poller,
// url-builder, headers) via vi.mock() so we can verify the client class
// orchestrates them correctly without making real network calls.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Module Mocks
// ---------------------------------------------------------------------------

vi.mock("../../src/client/fetcher", () => ({
  browserFetch: vi.fn(),
}));

vi.mock("../../src/client/scrape-poller", () => ({
  handleScrapeResponse: vi.fn(),
}));

vi.mock("../../src/url-builder", () => ({
  logoUrl: vi.fn(
    (domain: string, _opts?: unknown) =>
      `https://logos.getquikturn.io/${domain}`,
  ),
}));

vi.mock("../../src/headers", () => ({
  parseLogoHeaders: vi.fn(() => mockMetadata()),
}));

// Import mocked modules so we can configure return values per test
import { browserFetch } from "../../src/client/fetcher";
import { handleScrapeResponse } from "../../src/client/scrape-poller";
import { logoUrl } from "../../src/url-builder";
import { parseLogoHeaders } from "../../src/headers";

// Import the class under test (after mocks are declared)
import { QuikturnLogos } from "../../src/client/index";
import { AuthenticationError } from "../../src/errors";

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

/**
 * Creates a minimal mock Response that supports `.blob()`, `.headers`,
 * and the fields the client reads.
 */
function mockResponse(
  status: number,
  headers: Record<string, string> = {},
  blobContent: BlobPart[] = [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
): Response {
  const blob = new Blob(blobContent, { type: headers["Content-Type"] ?? "image/png" });
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    blob: () => Promise.resolve(blob),
    text: () => Promise.resolve(""),
    json: () => Promise.resolve({}),
    clone: () => mockResponse(status, headers, blobContent),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("QuikturnLogos", () => {
  // Track created object URLs so we can verify cleanup
  let createdUrls: string[];
  let revokedUrls: string[];
  let urlCounter: number;

  beforeEach(() => {
    vi.clearAllMocks();

    createdUrls = [];
    revokedUrls = [];
    urlCounter = 0;

    // Mock URL.createObjectURL / URL.revokeObjectURL (not natively in jsdom)
    globalThis.URL.createObjectURL = vi.fn(() => {
      const url = `blob:http://localhost/${++urlCounter}`;
      createdUrls.push(url);
      return url;
    });
    globalThis.URL.revokeObjectURL = vi.fn((url: string) => {
      revokedUrls.push(url);
    });

    // Default mock: browserFetch returns a successful image response
    vi.mocked(browserFetch).mockResolvedValue(
      mockResponse(200, { "Content-Type": "image/png" }),
    );

    // Default mock: handleScrapeResponse passes through
    vi.mocked(handleScrapeResponse).mockImplementation(
      async (response: Response) => response,
    );

    // Default mock: logoUrl builds a URL string
    vi.mocked(logoUrl).mockImplementation(
      (domain: string, _opts?: unknown) =>
        `https://logos.getquikturn.io/${domain}`,
    );

    // Default mock: parseLogoHeaders returns fixture
    vi.mocked(parseLogoHeaders).mockReturnValue(mockMetadata());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Constructor validation (T4.36 - T4.39)
  // -----------------------------------------------------------------------

  it("T4.36 - Constructor requires token option", () => {
    expect(() => new QuikturnLogos({ token: "" })).toThrow(AuthenticationError);
    expect(() => new QuikturnLogos({ token: "" })).toThrow("Token is required");
  });

  it("T4.37 - Constructor rejects sk_ prefixed tokens (server keys not allowed)", () => {
    expect(() => new QuikturnLogos({ token: "sk_test_abc123" })).toThrow(
      AuthenticationError,
    );
    expect(() => new QuikturnLogos({ token: "sk_test_abc123" })).toThrow(
      "Server keys (sk_) are not allowed in the browser client",
    );
  });

  it("T4.38 - Constructor accepts qt_ prefixed tokens", () => {
    const client = new QuikturnLogos({ token: "qt_test_abc123" });
    expect(client).toBeInstanceOf(QuikturnLogos);
  });

  it("T4.39 - Constructor accepts pk_ prefixed tokens", () => {
    const client = new QuikturnLogos({ token: "pk_test_abc123" });
    expect(client).toBeInstanceOf(QuikturnLogos);
  });

  it("T4.R9 - Constructor rejects whitespace-only tokens", () => {
    expect(() => new QuikturnLogos({ token: "   " })).toThrow(AuthenticationError);
    expect(() => new QuikturnLogos({ token: "   " })).toThrow("Token is required");
    expect(() => new QuikturnLogos({ token: "\t\n" })).toThrow(AuthenticationError);
  });

  // -----------------------------------------------------------------------
  // get() basic (T4.40 - T4.41)
  // -----------------------------------------------------------------------

  it("T4.40 - get('google.com') returns BrowserLogoResponse with url (blob:), blob, contentType, metadata", async () => {
    const client = new QuikturnLogos({ token: "qt_test_123" });
    const result = await client.get("google.com");

    expect(result.url).toMatch(/^blob:/);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.contentType).toBe("image/png");
    expect(result.metadata).toEqual(mockMetadata());
  });

  it("T4.41 - get() includes token in URL query parameter", async () => {
    const client = new QuikturnLogos({ token: "qt_my_token" });
    await client.get("google.com");

    // Verify logoUrl was called with the token
    expect(logoUrl).toHaveBeenCalledWith(
      "google.com",
      expect.objectContaining({ token: "qt_my_token" }),
    );
  });

  // -----------------------------------------------------------------------
  // TR.2b - get() rejects responses larger than MAX_RESPONSE_BODY_BYTES
  // -----------------------------------------------------------------------

  it("TR.2b - get() rejects responses larger than MAX_RESPONSE_BODY_BYTES", async () => {
    vi.mocked(browserFetch).mockResolvedValue(
      mockResponse(200, { "Content-Type": "image/png", "Content-Length": "11000000" }),
    );
    const client = new QuikturnLogos({ token: "qt_test_123" });
    await expect(client.get("huge-logo.com")).rejects.toThrow("exceeds maximum");
  });

  // -----------------------------------------------------------------------
  // get() with options (T4.42 - T4.43)
  // -----------------------------------------------------------------------

  it("T4.42 - get() with size option passes through correctly", async () => {
    const client = new QuikturnLogos({ token: "qt_test_123" });
    await client.get("github.com", { size: 256 });

    expect(logoUrl).toHaveBeenCalledWith(
      "github.com",
      expect.objectContaining({ size: 256 }),
    );
  });

  it("T4.43 - get() with all options (size, greyscale, theme, format) passes through", async () => {
    const client = new QuikturnLogos({ token: "qt_test_123" });
    await client.get("example.com", {
      size: 512,
      greyscale: true,
      theme: "dark",
      format: "webp",
    });

    expect(logoUrl).toHaveBeenCalledWith(
      "example.com",
      expect.objectContaining({
        size: 512,
        greyscale: true,
        theme: "dark",
        format: "webp",
      }),
    );
  });

  // -----------------------------------------------------------------------
  // get() with auto-scrape (T4.44 - T4.46)
  // -----------------------------------------------------------------------

  it("T4.44 - get() with autoScrape: true delegates to scrape poller", async () => {
    const scrapeResponse = mockResponse(200, { "Content-Type": "image/png" });
    vi.mocked(handleScrapeResponse).mockResolvedValueOnce(scrapeResponse);

    const client = new QuikturnLogos({ token: "qt_test_123" });
    await client.get("newsite.com", { autoScrape: true });

    // handleScrapeResponse should have been called
    expect(handleScrapeResponse).toHaveBeenCalledOnce();
    // Verify the original response and fetch function are passed
    expect(handleScrapeResponse).toHaveBeenCalledWith(
      expect.anything(), // original response
      expect.any(String), // original URL
      browserFetch, // fetch function reference
      expect.objectContaining({
        token: "qt_test_123",
      }),
    );
  });

  it("T4.45 - get() with onScrapeProgress callback passes through to poller", async () => {
    const onScrapeProgress = vi.fn();
    const client = new QuikturnLogos({ token: "qt_test_123" });

    await client.get("newsite.com", {
      autoScrape: true,
      onScrapeProgress,
    });

    expect(handleScrapeResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      browserFetch,
      expect.objectContaining({
        onScrapeProgress,
      }),
    );
  });

  it("T4.46 - get() with scrapeTimeout passes through to poller", async () => {
    const client = new QuikturnLogos({ token: "qt_test_123" });

    await client.get("newsite.com", {
      autoScrape: true,
      scrapeTimeout: 15_000,
    });

    expect(handleScrapeResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      browserFetch,
      expect.objectContaining({
        scrapeTimeout: 15_000,
      }),
    );
  });

  // -----------------------------------------------------------------------
  // get() abort signal (T4.47)
  // -----------------------------------------------------------------------

  it("T4.47 - get() with abort signal propagates to fetcher", async () => {
    const controller = new AbortController();
    const client = new QuikturnLogos({ token: "qt_test_123" });

    await client.get("google.com", { signal: controller.signal });

    expect(browserFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: controller.signal,
      }),
    );
  });

  // -----------------------------------------------------------------------
  // Event emitter: on() / off() (T4.48 - T4.50)
  // -----------------------------------------------------------------------

  it("T4.48 - on('rateLimitWarning') event fires when remaining < 10%", async () => {
    // Override browserFetch to invoke the onRateLimitWarning callback
    vi.mocked(browserFetch).mockImplementationOnce(
      async (_url: string, options?: { onRateLimitWarning?: (remaining: number, limit: number) => void }) => {
        // Simulate the fetcher calling the warning callback
        options?.onRateLimitWarning?.(4, 100);
        return mockResponse(200, { "Content-Type": "image/png" });
      },
    );

    const handler = vi.fn();
    const client = new QuikturnLogos({ token: "qt_test_123" });
    client.on("rateLimitWarning", handler);

    await client.get("google.com");

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(4, 100);
  });

  it("T4.49 - on('quotaWarning') event fires when remaining < 10%", async () => {
    // Override browserFetch to invoke the onQuotaWarning callback
    vi.mocked(browserFetch).mockImplementationOnce(
      async (_url: string, options?: { onQuotaWarning?: (remaining: number, limit: number) => void }) => {
        // Simulate the fetcher calling the warning callback
        options?.onQuotaWarning?.(40_000, 500_000);
        return mockResponse(200, { "Content-Type": "image/png" });
      },
    );

    const handler = vi.fn();
    const client = new QuikturnLogos({ token: "qt_test_123" });
    client.on("quotaWarning", handler);

    await client.get("google.com");

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(40_000, 500_000);
  });

  it("T4.50 - off() removes event listener", async () => {
    vi.mocked(browserFetch).mockImplementation(
      async (_url: string, options?: { onRateLimitWarning?: (remaining: number, limit: number) => void }) => {
        options?.onRateLimitWarning?.(4, 100);
        return mockResponse(200, { "Content-Type": "image/png" });
      },
    );

    const handler = vi.fn();
    const client = new QuikturnLogos({ token: "qt_test_123" });
    client.on("rateLimitWarning", handler);

    // First call: handler should fire
    await client.get("google.com");
    expect(handler).toHaveBeenCalledTimes(1);

    // Remove handler
    client.off("rateLimitWarning", handler);

    // Second call: handler should NOT fire
    await client.get("google.com");
    expect(handler).toHaveBeenCalledTimes(1); // still 1, not 2
  });

  // -----------------------------------------------------------------------
  // destroy() (T4.51)
  // -----------------------------------------------------------------------

  it("T4.51 - destroy() cleans up (revokes object URLs, removes listeners)", async () => {
    vi.mocked(browserFetch).mockImplementation(
      async (_url: string, options?: { onRateLimitWarning?: (remaining: number, limit: number) => void }) => {
        options?.onRateLimitWarning?.(4, 100);
        return mockResponse(200, { "Content-Type": "image/png" });
      },
    );

    const handler = vi.fn();
    const client = new QuikturnLogos({ token: "qt_test_123" });
    client.on("rateLimitWarning", handler);

    // Create two object URLs via get()
    await client.get("google.com");
    await client.get("github.com");
    expect(createdUrls).toHaveLength(2);

    // Destroy the client
    client.destroy();

    // All object URLs should be revoked
    expect(revokedUrls).toHaveLength(2);
    expect(revokedUrls).toEqual(expect.arrayContaining(createdUrls));

    // Listeners should be cleared: handler should not fire on a new get()
    // Re-mock to ensure clean state
    vi.mocked(browserFetch).mockImplementation(
      async (_url: string, options?: { onRateLimitWarning?: (remaining: number, limit: number) => void }) => {
        options?.onRateLimitWarning?.(2, 100);
        return mockResponse(200, { "Content-Type": "image/png" });
      },
    );

    await client.get("example.com");
    // handler should NOT have been called again (listeners were cleared by destroy)
    expect(handler).toHaveBeenCalledTimes(2); // only the two calls before destroy
  });

  // -----------------------------------------------------------------------
  // getUrl() (T4.52)
  // -----------------------------------------------------------------------

  it("T4.52 - getUrl() returns plain URL string (delegates to logoUrl())", () => {
    const client = new QuikturnLogos({ token: "qt_test_123" });
    const result = client.getUrl("google.com");

    expect(logoUrl).toHaveBeenCalledWith(
      "google.com",
      expect.objectContaining({ token: "qt_test_123" }),
    );
    expect(typeof result).toBe("string");
    expect(result).toContain("google.com");
  });

  // -----------------------------------------------------------------------
  // Custom baseUrl (T4.53)
  // -----------------------------------------------------------------------

  it("T4.53 - Custom baseUrl option propagates to URL builder", async () => {
    const client = new QuikturnLogos({
      token: "qt_test_123",
      baseUrl: "https://custom-api.example.com",
    });

    await client.get("google.com");

    expect(logoUrl).toHaveBeenCalledWith(
      "google.com",
      expect.objectContaining({
        baseUrl: "https://custom-api.example.com",
      }),
    );
  });

  // -----------------------------------------------------------------------
  // Error propagation (T4.R10)
  // -----------------------------------------------------------------------

  it("T4.R10 - get() propagates fetcher errors unchanged", async () => {
    const authError = new AuthenticationError("Authentication failed");
    vi.mocked(browserFetch).mockRejectedValue(authError);

    const client = new QuikturnLogos({ token: "qt_test_123" });
    await expect(client.get("google.com")).rejects.toThrow(authError);
    await expect(client.get("google.com")).rejects.toBeInstanceOf(AuthenticationError);
  });

  // -----------------------------------------------------------------------
  // Concurrent get() calls (T4.54)
  // -----------------------------------------------------------------------

  it("T4.54 - Multiple concurrent get() calls work correctly", async () => {
    const client = new QuikturnLogos({ token: "qt_test_123" });

    const [result1, result2, result3] = await Promise.all([
      client.get("google.com"),
      client.get("github.com"),
      client.get("example.com"),
    ]);

    // All three should succeed with distinct blob URLs
    expect(result1.url).toMatch(/^blob:/);
    expect(result2.url).toMatch(/^blob:/);
    expect(result3.url).toMatch(/^blob:/);

    // Each should have a unique blob URL
    const urls = new Set([result1.url, result2.url, result3.url]);
    expect(urls.size).toBe(3);

    // browserFetch should have been called 3 times
    expect(browserFetch).toHaveBeenCalledTimes(3);

    // 3 object URLs should have been created
    expect(createdUrls).toHaveLength(3);
  });
});
