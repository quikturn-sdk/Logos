import { describe, it, expect } from "vitest";

import { parseLogoHeaders, parseRetryAfter } from "../src/headers";

// ---------------------------------------------------------------------------
// Phase 3B - Header Parser (RED phase)
//
// These tests define the contract for src/headers.ts which does not exist
// yet. Every test here is expected to FAIL until the implementation is written.
// ---------------------------------------------------------------------------

/**
 * Helper: constructs a Headers instance from a plain object.
 * Simplifies test setup by avoiding verbose `new Headers()` + `.set()` calls.
 */
function makeHeaders(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("parseLogoHeaders", () => {
  // -----------------------------------------------------------------------
  // Cache status (T3.14 - T3.16)
  // -----------------------------------------------------------------------
  describe("cache status", () => {
    it("T3.14 - parses cache status HIT", () => {
      const result = parseLogoHeaders(
        makeHeaders({ "X-Cache-Status": "HIT" }),
      );
      expect(result.cache.status).toBe("HIT");
    });

    it("T3.15 - parses cache status MISS", () => {
      const result = parseLogoHeaders(
        makeHeaders({ "X-Cache-Status": "MISS" }),
      );
      expect(result.cache.status).toBe("MISS");
    });

    it("T3.16 - defaults to MISS when X-Cache-Status header is missing", () => {
      const result = parseLogoHeaders(makeHeaders({}));
      expect(result.cache.status).toBe("MISS");
    });
  });

  // -----------------------------------------------------------------------
  // Rate limit (T3.17 - T3.18)
  // -----------------------------------------------------------------------
  describe("rate limit", () => {
    it("T3.17 - parses rateLimit.remaining from X-RateLimit-Remaining", () => {
      const result = parseLogoHeaders(
        makeHeaders({ "X-RateLimit-Remaining": "499" }),
      );
      expect(result.rateLimit.remaining).toBe(499);
    });

    it("T3.18 - parses rateLimit.reset as Date from unix timestamp", () => {
      const result = parseLogoHeaders(
        makeHeaders({ "X-RateLimit-Reset": "1700000060" }),
      );
      expect(result.rateLimit.reset).toBeInstanceOf(Date);
      expect(result.rateLimit.reset.getTime()).toBe(1700000060 * 1000);
    });
  });

  // -----------------------------------------------------------------------
  // Quota (T3.19)
  // -----------------------------------------------------------------------
  describe("quota", () => {
    it("T3.19 - parses quota.remaining and quota.limit", () => {
      const result = parseLogoHeaders(
        makeHeaders({
          "X-Quota-Remaining": "999500",
          "X-Quota-Limit": "1000000",
        }),
      );
      expect(result.quota.remaining).toBe(999500);
      expect(result.quota.limit).toBe(1000000);
    });
  });

  // -----------------------------------------------------------------------
  // Token prefix (T3.20)
  // -----------------------------------------------------------------------
  describe("token prefix", () => {
    it("T3.20 - parses tokenPrefix from X-Quikturn-Token", () => {
      const result = parseLogoHeaders(
        makeHeaders({ "X-Quikturn-Token": "pk_abc..." }),
      );
      expect(result.tokenPrefix).toBe("pk_abc...");
    });
  });

  // -----------------------------------------------------------------------
  // Transformation (T3.21 - T3.24)
  // -----------------------------------------------------------------------
  describe("transformation", () => {
    it("T3.21 - parses transformation.applied = true", () => {
      const result = parseLogoHeaders(
        makeHeaders({ "X-Transformation-Applied": "true" }),
      );
      expect(result.transformation.applied).toBe(true);
    });

    it("T3.22 - defaults transformation.applied to false when header is missing", () => {
      const result = parseLogoHeaders(makeHeaders({}));
      expect(result.transformation.applied).toBe(false);
    });

    it("T3.23 - parses all transformation detail headers", () => {
      const result = parseLogoHeaders(
        makeHeaders({
          "X-Transformation-Applied": "true",
          "X-Transformation-Method": "images-binding",
          "X-Transformation-Width": "256",
          "X-Transformation-Greyscale": "true",
          "X-Transformation-Gamma": "1.12",
        }),
      );
      expect(result.transformation.applied).toBe(true);
      expect(result.transformation.method).toBe("images-binding");
      expect(result.transformation.width).toBe(256);
      expect(result.transformation.greyscale).toBe(true);
      expect(result.transformation.gamma).toBe(1.12);
    });

    it("T3.24 - parses transformation.status values", () => {
      const notRequested = parseLogoHeaders(
        makeHeaders({ "X-Transformation-Status": "not-requested" }),
      );
      expect(notRequested.transformation.status).toBe("not-requested");

      const unsupported = parseLogoHeaders(
        makeHeaders({ "X-Transformation-Status": "unsupported-format" }),
      );
      expect(unsupported.transformation.status).toBe("unsupported-format");

      const error = parseLogoHeaders(
        makeHeaders({ "X-Transformation-Status": "transformation-error" }),
      );
      expect(error.transformation.status).toBe("transformation-error");
    });

    it("Unrecognized X-Transformation-Status is treated as undefined", () => {
      const h = makeHeaders({ "X-Transformation-Status": "some-future-status" });
      const meta = parseLogoHeaders(h);
      expect(meta.transformation.status).toBeUndefined();
    });

    it("Unrecognized X-Transformation-Method is treated as undefined", () => {
      const h = makeHeaders({ "X-Transformation-Method": "some-future-method" });
      const meta = parseLogoHeaders(h);
      expect(meta.transformation.method).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Missing headers / defaults (T3.25)
  // -----------------------------------------------------------------------
  describe("missing headers", () => {
    it("T3.25 - returns sensible defaults when all headers are missing", () => {
      const result = parseLogoHeaders(makeHeaders({}));

      // Cache defaults to MISS
      expect(result.cache.status).toBe("MISS");

      // Rate limit defaults
      expect(result.rateLimit.remaining).toBe(0);
      expect(result.rateLimit.reset).toBeInstanceOf(Date);

      // Quota defaults
      expect(result.quota.remaining).toBe(0);
      expect(result.quota.limit).toBe(0);

      // Transformation defaults
      expect(result.transformation.applied).toBe(false);

      // Token prefix is undefined when missing
      expect(result.tokenPrefix).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Non-numeric values (T3.26)
  // -----------------------------------------------------------------------
  describe("non-numeric values", () => {
    it("T3.26 - handles non-numeric header values without throwing", () => {
      const result = parseLogoHeaders(
        makeHeaders({
          "X-RateLimit-Remaining": "abc",
          "X-Quota-Limit": "xyz",
        }),
      );

      // Should not throw; non-numeric values fall back to 0
      expect(result.rateLimit.remaining).toBe(0);
      expect(result.quota.limit).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// parseRetryAfter (T3.27)
// ---------------------------------------------------------------------------
describe("parseRetryAfter", () => {
  it("T3.27 - parses numeric Retry-After header", () => {
    const result = parseRetryAfter(makeHeaders({ "Retry-After": "55" }));
    expect(result).toBe(55);
  });

  it("T3.27 - returns null when Retry-After header is missing", () => {
    const result = parseRetryAfter(makeHeaders({}));
    expect(result).toBeNull();
  });

  it("T3.27 - returns null for non-numeric Retry-After value", () => {
    const result = parseRetryAfter(
      makeHeaders({ "Retry-After": "not-a-number" }),
    );
    expect(result).toBeNull();
  });

  it("parseRetryAfter returns negative values as-is (consumer must handle)", () => {
    const h = makeHeaders({ "Retry-After": "-5" });
    expect(parseRetryAfter(h)).toBe(-5);
  });

  it("parseRetryAfter returns float values", () => {
    const h = makeHeaders({ "Retry-After": "2.5" });
    expect(parseRetryAfter(h)).toBe(2.5);
  });
});
