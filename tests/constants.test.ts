import { describe, it, expect } from "vitest";

import type { SupportedOutputFormat } from "../src/types";
import {
  DEFAULT_WIDTH,
  MAX_WIDTH,
  MAX_WIDTH_SERVER,
  BASE_URL,
  SUPPORTED_FORMATS,
  DEFAULT_FORMAT,
  RATE_LIMITS,
  SERVER_RATE_LIMITS,
  MONTHLY_LIMITS,
  FORMAT_ALIASES,
  TIERS,
  KEY_TYPES,
} from "../src/constants";

// ---------------------------------------------------------------------------
// Phase 1 - Shared Types & Constants (RED phase)
//
// These tests define the contract for src/constants.ts which does not exist
// yet. Every test here is expected to FAIL until the implementation is written.
// ---------------------------------------------------------------------------

describe("constants", () => {
  // -----------------------------------------------------------------------
  // Basic constants (T1.1 - T1.4)
  // -----------------------------------------------------------------------
  describe("Basic constants", () => {
    it("T1.1 - DEFAULT_WIDTH equals 128", () => {
      expect(DEFAULT_WIDTH).toBe(128);
    });

    it("T1.2 - MAX_WIDTH equals 800", () => {
      expect(MAX_WIDTH).toBe(800);
    });

    it("T1.3 - MAX_WIDTH_SERVER equals 1200", () => {
      expect(MAX_WIDTH_SERVER).toBe(1200);
    });

    it("T1.4 - BASE_URL equals 'https://logos.getquikturn.io'", () => {
      expect(BASE_URL).toBe("https://logos.getquikturn.io");
    });
  });

  // -----------------------------------------------------------------------
  // Format constants (T1.5, T1.6, FORMAT_ALIASES)
  // -----------------------------------------------------------------------
  describe("Format constants", () => {
    it("T1.5 - SUPPORTED_FORMATS is a ReadonlySet containing exactly the four MIME types", () => {
      // Verify it behaves like a Set (has .has() and .size)
      expect(SUPPORTED_FORMATS.size).toBe(4);
      expect(SUPPORTED_FORMATS.has("image/png")).toBe(true);
      expect(SUPPORTED_FORMATS.has("image/jpeg")).toBe(true);
      expect(SUPPORTED_FORMATS.has("image/webp")).toBe(true);
      expect(SUPPORTED_FORMATS.has("image/avif")).toBe(true);
    });

    it("T1.5 - SUPPORTED_FORMATS does not contain unsupported formats", () => {
       
      expect(SUPPORTED_FORMATS.has("image/gif" as unknown as SupportedOutputFormat)).toBe(false);

      expect(SUPPORTED_FORMATS.has("image/svg+xml" as unknown as SupportedOutputFormat)).toBe(false);
    });

    it("T1.6 - DEFAULT_FORMAT equals 'image/png'", () => {
      expect(DEFAULT_FORMAT).toBe("image/png");
    });

    it("FORMAT_ALIASES maps 'png' to 'image/png'", () => {
      expect(FORMAT_ALIASES.png).toBe("image/png");
    });

    it("FORMAT_ALIASES maps 'jpeg' to 'image/jpeg'", () => {
      expect(FORMAT_ALIASES.jpeg).toBe("image/jpeg");
    });

    it("FORMAT_ALIASES maps 'webp' to 'image/webp'", () => {
      expect(FORMAT_ALIASES.webp).toBe("image/webp");
    });

    it("FORMAT_ALIASES maps 'avif' to 'image/avif'", () => {
      expect(FORMAT_ALIASES.avif).toBe("image/avif");
    });

    it("FORMAT_ALIASES contains exactly 4 entries", () => {
      expect(Object.keys(FORMAT_ALIASES)).toHaveLength(4);
    });
  });

  // -----------------------------------------------------------------------
  // Tier validation (T1.7, T1.8)
  // -----------------------------------------------------------------------
  describe("Tier validation", () => {
    it("T1.7 - TIERS contains exactly 'free', 'launch', 'growth', 'enterprise'", () => {
      expect(TIERS).toHaveLength(4);
      expect(TIERS).toContain("free");
      expect(TIERS).toContain("launch");
      expect(TIERS).toContain("growth");
      expect(TIERS).toContain("enterprise");
    });

    it("T1.7 - RATE_LIMITS keys match all four tier values", () => {
      const rateLimitKeys = Object.keys(RATE_LIMITS);
      expect(rateLimitKeys).toHaveLength(4);
      expect(rateLimitKeys).toContain("free");
      expect(rateLimitKeys).toContain("launch");
      expect(rateLimitKeys).toContain("growth");
      expect(rateLimitKeys).toContain("enterprise");
    });

    it("T1.8 - KEY_TYPES contains exactly 'publishable' and 'secret'", () => {
      expect(KEY_TYPES).toHaveLength(2);
      expect(KEY_TYPES).toContain("publishable");
      expect(KEY_TYPES).toContain("secret");
    });
  });

  // -----------------------------------------------------------------------
  // Rate limits (T1.9, T1.10)
  // -----------------------------------------------------------------------
  describe("Rate limits", () => {
    describe("T1.9 - RATE_LIMITS (publishable / per-minute)", () => {
      it("free tier: 100 requests per 60 seconds", () => {
        expect(RATE_LIMITS.free).toEqual({
          requests: 100,
          windowSeconds: 60,
        });
      });

      it("launch tier: 500 requests per 60 seconds", () => {
        expect(RATE_LIMITS.launch).toEqual({
          requests: 500,
          windowSeconds: 60,
        });
      });

      it("growth tier: 5000 requests per 60 seconds", () => {
        expect(RATE_LIMITS.growth).toEqual({
          requests: 5_000,
          windowSeconds: 60,
        });
      });

      it("enterprise tier: 50000 requests per 60 seconds", () => {
        expect(RATE_LIMITS.enterprise).toEqual({
          requests: 50_000,
          windowSeconds: 60,
        });
      });
    });

    describe("T1.10 - SERVER_RATE_LIMITS (secret / per-minute, no free tier)", () => {
      it("does not include a free tier", () => {
        expect(
          Object.prototype.hasOwnProperty.call(SERVER_RATE_LIMITS, "free"),
        ).toBe(false);
      });

      it("has exactly 3 tiers", () => {
        expect(Object.keys(SERVER_RATE_LIMITS)).toHaveLength(3);
      });

      it("launch tier: 1000 requests per 60 seconds", () => {
        expect(SERVER_RATE_LIMITS.launch).toEqual({
          requests: 1_000,
          windowSeconds: 60,
        });
      });

      it("growth tier: 10000 requests per 60 seconds", () => {
        expect(SERVER_RATE_LIMITS.growth).toEqual({
          requests: 10_000,
          windowSeconds: 60,
        });
      });

      it("enterprise tier: 100000 requests per 60 seconds", () => {
        expect(SERVER_RATE_LIMITS.enterprise).toEqual({
          requests: 100_000,
          windowSeconds: 60,
        });
      });
    });
  });

  // -----------------------------------------------------------------------
  // Monthly limits (T1.11)
  // -----------------------------------------------------------------------
  describe("Monthly limits", () => {
    it("T1.11 - free tier monthly limit is 500,000", () => {
      expect(MONTHLY_LIMITS.free).toBe(500_000);
    });

    it("T1.11 - launch tier monthly limit is 1,000,000", () => {
      expect(MONTHLY_LIMITS.launch).toBe(1_000_000);
    });

    it("T1.11 - growth tier monthly limit is 5,000,000", () => {
      expect(MONTHLY_LIMITS.growth).toBe(5_000_000);
    });

    it("T1.11 - enterprise tier monthly limit is 10,000,000", () => {
      expect(MONTHLY_LIMITS.enterprise).toBe(10_000_000);
    });

    it("T1.11 - MONTHLY_LIMITS has exactly 4 entries", () => {
      expect(Object.keys(MONTHLY_LIMITS)).toHaveLength(4);
    });
  });
});
