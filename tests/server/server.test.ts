import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { LogoMetadata } from "../../src/types";

// ---------------------------------------------------------------------------
// Phase 5C - Server Client Class (TDD)
//
// Tests mock the internal dependency modules (fetcher, batch, scrape-poller,
// url-builder, headers) via vi.mock() so we can verify the server client class
// orchestrates them correctly without making real network calls.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Module Mocks
// ---------------------------------------------------------------------------

vi.mock("../../src/server/fetcher", () => ({
  serverFetch: vi.fn(),
}));

vi.mock("../../src/server/batch", () => ({
  getMany: vi.fn(),
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

vi.mock("../../src/client/scrape-poller", () => ({
  handleScrapeResponse: vi.fn(),
}));

// Import mocked modules so we can configure return values per test
import { serverFetch } from "../../src/server/fetcher";
import { getMany } from "../../src/server/batch";
import { logoUrl } from "../../src/url-builder";
import { parseLogoHeaders } from "../../src/headers";
import { handleScrapeResponse } from "../../src/client/scrape-poller";

// Import the class under test (after mocks are declared)
import { QuikturnLogos } from "../../src/server/index";
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
 * Creates a minimal mock Response that supports `.arrayBuffer()`, `.headers`,
 * `.body` (ReadableStream), and the fields the server client reads.
 */
function mockResponse(
  status: number,
  headers: Record<string, string> = {},
  bodyContent: Uint8Array = new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    arrayBuffer: () => Promise.resolve(bodyContent.buffer),
    text: () => Promise.resolve(""),
    json: () => Promise.resolve({}),
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(bodyContent);
        controller.close();
      },
    }),
    clone: () => mockResponse(status, headers, bodyContent),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("QuikturnLogos (server)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: serverFetch returns a successful image response
    vi.mocked(serverFetch).mockResolvedValue(
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
  // Constructor validation (T5.21 - T5.23)
  // -----------------------------------------------------------------------

  it("T5.21 - Constructor requires secretKey option", () => {
    expect(() => new QuikturnLogos({ secretKey: "" })).toThrow(
      AuthenticationError,
    );
    expect(() => new QuikturnLogos({ secretKey: "" })).toThrow(
      "Secret key is required",
    );
  });

  it("T5.22 - Constructor rejects qt_/pk_ prefixed tokens (publishable keys not allowed)", () => {
    expect(() => new QuikturnLogos({ secretKey: "qt_test" })).toThrow(
      AuthenticationError,
    );
    expect(() => new QuikturnLogos({ secretKey: "qt_test" })).toThrow(
      "Server client requires a secret key (sk_ prefix)",
    );
    expect(() => new QuikturnLogos({ secretKey: "pk_test" })).toThrow(
      AuthenticationError,
    );
    expect(() => new QuikturnLogos({ secretKey: "pk_test" })).toThrow(
      "Server client requires a secret key (sk_ prefix)",
    );
  });

  it("T5.23 - Constructor accepts sk_ prefixed tokens", () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_abc" });
    expect(client).toBeInstanceOf(QuikturnLogos);
  });

  it("T5.23b - Constructor rejects keys without sk_ prefix", () => {
    expect(() => new QuikturnLogos({ secretKey: "random_key_123" })).toThrow(AuthenticationError);
    expect(() => new QuikturnLogos({ secretKey: "random_key_123" })).toThrow("Server client requires a secret key (sk_ prefix)");
    expect(() => new QuikturnLogos({ secretKey: "mytoken" })).toThrow(AuthenticationError);
  });

  // -----------------------------------------------------------------------
  // TR.2 - get() rejects responses larger than MAX_RESPONSE_BODY_BYTES
  // -----------------------------------------------------------------------

  it("TR.2 - get() rejects responses larger than MAX_RESPONSE_BODY_BYTES", async () => {
    // Mock a response with Content-Length exceeding the limit
    vi.mocked(serverFetch).mockResolvedValue(
      mockResponse(200, { "Content-Type": "image/png", "Content-Length": "11000000" }),
    );
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    await expect(client.get("huge-logo.com")).rejects.toThrow("exceeds maximum");
  });

  // -----------------------------------------------------------------------
  // get() basic (T5.24 - T5.25)
  // -----------------------------------------------------------------------

  it("T5.24 - get() returns ServerLogoResponse with buffer, contentType, metadata", async () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    const result = await client.get("github.com");

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.contentType).toBe("image/png");
    expect(result.metadata).toEqual(mockMetadata());
  });

  it("T5.25 - get() uses Authorization header, not query param", async () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    await client.get("github.com");

    // Verify logoUrl was called WITHOUT token (server uses Authorization header)
    expect(logoUrl).toHaveBeenCalledWith(
      "github.com",
      expect.not.objectContaining({ token: expect.anything() }),
    );

    // Verify serverFetch was called with the token for Bearer auth
    expect(serverFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ token: "sk_test_123" }),
    );
  });

  // -----------------------------------------------------------------------
  // get() with size options (T5.26 - T5.27)
  // -----------------------------------------------------------------------

  it("T5.26 - get() with size: 1200 passes through (server max)", async () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    await client.get("github.com", { size: 1200 });

    expect(logoUrl).toHaveBeenCalledWith(
      "github.com",
      expect.objectContaining({ size: 1200 }),
    );
  });

  it("T5.27 - get() with size: 2000 passes to logoUrl (URL builder handles clamping)", async () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    await client.get("github.com", { size: 2000 });

    // The server client passes the raw size; the URL builder handles clamping
    expect(logoUrl).toHaveBeenCalledWith(
      "github.com",
      expect.objectContaining({ size: 2000 }),
    );
  });

  // -----------------------------------------------------------------------
  // get() with format (T5.28)
  // -----------------------------------------------------------------------

  it("T5.28 - get() with format 'avif' sets Accept header via serverFetch", async () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    await client.get("github.com", { format: "avif" });

    // format passed to logoUrl for query param
    expect(logoUrl).toHaveBeenCalledWith(
      "github.com",
      expect.objectContaining({ format: "avif" }),
    );

    // serverFetch receives the resolved Accept header
    expect(serverFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ format: "image/avif" }),
    );
  });

  // -----------------------------------------------------------------------
  // get() with autoScrape (T5.29)
  // -----------------------------------------------------------------------

  it("T5.29 - get() with autoScrape: true delegates to scrape poller", async () => {
    const scrapeResponse = mockResponse(200, { "Content-Type": "image/png" });
    vi.mocked(handleScrapeResponse).mockResolvedValueOnce(scrapeResponse);

    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    await client.get("newsite.com", { autoScrape: true });

    // handleScrapeResponse should have been called
    expect(handleScrapeResponse).toHaveBeenCalledOnce();
    // Verify the original response, URL, and a fetch function are passed
    expect(handleScrapeResponse).toHaveBeenCalledWith(
      expect.anything(), // original response
      expect.any(String), // original URL
      expect.any(Function), // wrapped fetch function
      expect.objectContaining({
        scrapeTimeout: undefined,
        signal: undefined,
      }),
    );
  });

  // -----------------------------------------------------------------------
  // getMany() (T5.30 - T5.31)
  // -----------------------------------------------------------------------

  it("T5.30 - getMany() returns async iterable of BatchResult", async () => {
    vi.mocked(getMany).mockImplementation(async function* (domains) {
      for (const domain of domains) {
        yield {
          domain,
          success: true,
          buffer: Buffer.from("logo"),
          contentType: "image/png",
          metadata: mockMetadata(),
        };
      }
    });

    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    const results: unknown[] = [];
    for await (const result of client.getMany(["github.com", "google.com"])) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(
      expect.objectContaining({ domain: "github.com", success: true }),
    );
    expect(results[1]).toEqual(
      expect.objectContaining({ domain: "google.com", success: true }),
    );
  });

  it("T5.31 - getMany() with concurrency option respected (passed to batch module)", async () => {
    vi.mocked(getMany).mockImplementation(async function* () {
      // No results needed for this test
    });

    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _result of client.getMany(["github.com"], {
      concurrency: 3,
    })) {
      // Consume the iterator
    }

    expect(getMany).toHaveBeenCalledWith(
      ["github.com"],
      expect.any(Function),
      expect.objectContaining({ concurrency: 3 }),
    );
  });

  // -----------------------------------------------------------------------
  // getUrl() (T5.32)
  // -----------------------------------------------------------------------

  it("T5.32 - getUrl() returns URL string without token (security: sk_ keys must not appear in URLs)", () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    const result = client.getUrl("google.com");

    // Verify logoUrl was called WITHOUT token (security: sk_ keys must never appear in URLs)
    expect(logoUrl).toHaveBeenCalledWith(
      "google.com",
      expect.not.objectContaining({ token: expect.anything() }),
    );
    expect(typeof result).toBe("string");
    expect(result).toContain("google.com");
  });

  it("T5.32b - getUrl() does NOT include secret key in URL query params", () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    client.getUrl("google.com");

    // Verify logoUrl was called WITHOUT token (security: sk_ keys must never appear in URLs)
    expect(logoUrl).toHaveBeenCalledWith(
      "google.com",
      expect.not.objectContaining({ token: expect.anything() }),
    );
  });

  // -----------------------------------------------------------------------
  // getStream() (T5.33)
  // -----------------------------------------------------------------------

  it("T5.33 - getStream() returns raw Response body (ReadableStream)", async () => {
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    const stream = await client.getStream("github.com");

    expect(stream).toBeInstanceOf(ReadableStream);
  });

  // -----------------------------------------------------------------------
  // Custom baseUrl (T5.34)
  // -----------------------------------------------------------------------

  it("T5.34 - Custom baseUrl propagates to URL builder", async () => {
    const client = new QuikturnLogos({
      secretKey: "sk_test_123",
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
  // Events: on/off (T5.35)
  // -----------------------------------------------------------------------

  it("T5.35 - on/off events work (rateLimitWarning, quotaWarning)", async () => {
    // Override serverFetch to invoke the onRateLimitWarning callback
    vi.mocked(serverFetch).mockImplementationOnce(
      async (
        _url: string,
        options?: {
          onRateLimitWarning?: (remaining: number, limit: number) => void;
        },
      ) => {
        // Simulate the fetcher calling the warning callback
        options?.onRateLimitWarning?.(4, 100);
        return mockResponse(200, { "Content-Type": "image/png" });
      },
    );

    const handler = vi.fn();
    const client = new QuikturnLogos({ secretKey: "sk_test_123" });
    client.on("rateLimitWarning", handler);

    await client.get("google.com");

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(4, 100);

    // Remove handler and verify it no longer fires
    client.off("rateLimitWarning", handler);

    vi.mocked(serverFetch).mockImplementationOnce(
      async (
        _url: string,
        options?: {
          onRateLimitWarning?: (remaining: number, limit: number) => void;
        },
      ) => {
        options?.onRateLimitWarning?.(2, 100);
        return mockResponse(200, { "Content-Type": "image/png" });
      },
    );

    await client.get("google.com");

    // handler should NOT have been called again
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
