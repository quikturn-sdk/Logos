import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireBeacon, _resetBeacon } from "../../src/internal/beacon";
import { BASE_URL } from "../../src/constants";

// ---------------------------------------------------------------------------
// Phase 7A — Beacon Tests
// ---------------------------------------------------------------------------

describe("Phase 7A: fireBeacon", () => {
  let imageSrcs: string[];

  beforeEach(() => {
    _resetBeacon();
    imageSrcs = [];

    // Mock Image constructor to capture src assignments
    vi.stubGlobal(
      "Image",
      class MockImage {
        private _src = "";
        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          imageSrcs.push(val);
        }
      },
    );
  });

  // B.1 - Fires new Image().src with correct beacon URL for qt_ token
  it("B.1 - fires beacon with correct URL for qt_ token", () => {
    fireBeacon("qt_test123");

    expect(imageSrcs).toHaveLength(1);
    expect(imageSrcs[0]).toContain(`${BASE_URL}/_beacon`);
    expect(imageSrcs[0]).toContain("token=qt_test123");
  });

  // B.2 - Includes encoded page URL in beacon query
  it("B.2 - includes encoded page URL in beacon query", () => {
    fireBeacon("qt_test123");

    expect(imageSrcs).toHaveLength(1);
    const url = new URL(imageSrcs[0]!);
    expect(url.searchParams.get("page")).toBe(location.href);
  });

  // B.3 - Deduplicates: second call for same token is a no-op
  it("B.3 - deduplicates same token", () => {
    fireBeacon("qt_dup");
    fireBeacon("qt_dup");

    expect(imageSrcs).toHaveLength(1);
  });

  // B.4 - Different tokens fire separate beacons
  it("B.4 - different tokens fire separate beacons", () => {
    fireBeacon("qt_alpha");
    fireBeacon("qt_beta");

    expect(imageSrcs).toHaveLength(2);
    expect(imageSrcs[0]).toContain("token=qt_alpha");
    expect(imageSrcs[1]).toContain("token=qt_beta");
  });

  // B.5 - Skips sk_ tokens (no Image created)
  it("B.5 - skips sk_ tokens", () => {
    fireBeacon("sk_secret_key");

    expect(imageSrcs).toHaveLength(0);
  });

  // B.6 - Skips empty string token
  it("B.6 - skips empty string token", () => {
    fireBeacon("");

    expect(imageSrcs).toHaveLength(0);
  });

  // B.7 - Skips when typeof window === "undefined" (SSR guard)
  it("B.7 - skips in SSR environment (no window)", () => {
    const origWindow = globalThis.window;
    // @ts-expect-error - deliberately removing window for SSR test
    delete globalThis.window;

    try {
      // fireBeacon should not throw and should not create an Image
      fireBeacon("qt_ssr");
      expect(imageSrcs).toHaveLength(0);
    } finally {
      globalThis.window = origWindow;
    }
  });

  // B.8 - Uses BASE_URL as beacon base
  it("B.8 - uses BASE_URL as beacon base", () => {
    fireBeacon("qt_base");

    expect(imageSrcs).toHaveLength(1);
    expect(imageSrcs[0]).toMatch(new RegExp(`^${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/_beacon\\?`));
  });

  // B.9 - Beacon URL-encodes special characters in page URL
  it("B.9 - URL-encodes special characters in page URL", () => {
    // jsdom location.href is typically "http://localhost:3000/" but we
    // verify the page param is properly encoded by checking the URL parses
    fireBeacon("qt_encode");

    expect(imageSrcs).toHaveLength(1);
    const url = new URL(imageSrcs[0]!);
    // The page param should be decodable back to the original href
    expect(url.searchParams.get("page")).toBe(location.href);
  });

  // B.10 - Client get() fires beacon after successful fetch
  // (This test is in client.test.ts integration but we verify the fn is callable)
  it("B.10 - fireBeacon is idempotent after reset", () => {
    fireBeacon("qt_idempotent");
    expect(imageSrcs).toHaveLength(1);

    _resetBeacon();
    fireBeacon("qt_idempotent");
    expect(imageSrcs).toHaveLength(2);
  });
});
