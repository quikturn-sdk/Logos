import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only (no-op in tests, throws in client bundles)
vi.mock("server-only", () => ({}));

// Mock @quikturn/logos/server to avoid real network calls
const mockGet = vi.fn();
const mockGetMany = vi.fn();

vi.mock("@quikturn/logos/server", () => ({
  QuikturnLogos: vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    opts: { secretKey: string },
  ) {
    this.get = mockGet;
    this.getMany = mockGetMany;
    this.secretKey = opts.secretKey;
  }),
}));

import {
  getServerClient,
  getLogoBuffer,
  _resetServerClient,
  QuikturnLogos,
} from "../src/server";

describe("getServerClient", () => {
  beforeEach(() => {
    _resetServerClient();
    vi.clearAllMocks();
    delete process.env.QUIKTURN_SECRET_KEY;
  });

  it("throws when QUIKTURN_SECRET_KEY is not set", () => {
    expect(() => getServerClient()).toThrow(
      "QUIKTURN_SECRET_KEY environment variable is not set",
    );
  });

  it("returns a QuikturnLogos instance when env var is set", () => {
    process.env.QUIKTURN_SECRET_KEY = "sk_test123";
    const client = getServerClient();

    expect(QuikturnLogos).toHaveBeenCalledWith({ secretKey: "sk_test123" });
    expect(client).toBeDefined();
    expect(client.secretKey).toBe("sk_test123");
  });

  it("caches the client (singleton)", () => {
    process.env.QUIKTURN_SECRET_KEY = "sk_test123";

    const client1 = getServerClient();
    const client2 = getServerClient();

    expect(client1).toBe(client2);
    expect(QuikturnLogos).toHaveBeenCalledTimes(1);
  });

  it("returns fresh client after _resetServerClient()", () => {
    process.env.QUIKTURN_SECRET_KEY = "sk_test123";

    const client1 = getServerClient();
    _resetServerClient();
    const client2 = getServerClient();

    expect(client1).not.toBe(client2);
    expect(QuikturnLogos).toHaveBeenCalledTimes(2);
  });
});

describe("getLogoBuffer", () => {
  beforeEach(() => {
    _resetServerClient();
    vi.clearAllMocks();
    process.env.QUIKTURN_SECRET_KEY = "sk_test123";
  });

  it("delegates to client.get()", async () => {
    const mockResponse = {
      buffer: Buffer.from("png"),
      contentType: "image/png",
      metadata: {},
    };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await getLogoBuffer("github.com");

    expect(mockGet).toHaveBeenCalledWith("github.com", undefined);
    expect(result).toBe(mockResponse);
  });

  it("passes options through", async () => {
    const mockResponse = {
      buffer: Buffer.from("png"),
      contentType: "image/png",
      metadata: {},
    };
    mockGet.mockResolvedValueOnce(mockResponse);

    await getLogoBuffer("github.com", { size: 256 });

    expect(mockGet).toHaveBeenCalledWith("github.com", { size: 256 });
  });
});

describe("re-exports", () => {
  it("re-exports QuikturnLogos class", () => {
    expect(QuikturnLogos).toBeDefined();
    expect(typeof QuikturnLogos).toBe("function");
  });
});
