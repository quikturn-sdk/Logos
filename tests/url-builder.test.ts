import { describe, it, expect } from "vitest";

import { logoUrl } from "../src/url-builder";
import { LogoError, DomainValidationError } from "../src/errors";
import type { ThemeOption, SupportedOutputFormat } from "../src/types";

// ---------------------------------------------------------------------------
// Phase 2 - Universal URL Builder (RED phase)
//
// These tests define the contract for src/url-builder.ts and src/errors.ts
// which do not exist yet. Every test here is expected to FAIL until the
// implementation is written.
// ---------------------------------------------------------------------------

/**
 * Helper: parses a URL string and returns the URLSearchParams for easy
 * assertion of individual query parameters.
 */
function params(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

describe("logoUrl", () => {
  // -----------------------------------------------------------------------
  // Basic URL generation (T2.1 - T2.4)
  // -----------------------------------------------------------------------
  describe("basic URL generation", () => {
    it("T2.1 - returns base URL with domain path and autoScrape when called with domain only", () => {
      const url = logoUrl("google.com");
      expect(url).toBe("https://logos.getquikturn.io/google.com?autoScrape=true");
    });

    it("T2.2 - includes token as query parameter", () => {
      const url = logoUrl("google.com", { token: "pk_xxx" });
      expect(params(url).get("token")).toBe("pk_xxx");
    });

    it("T2.3 - includes size as query parameter", () => {
      const url = logoUrl("google.com", { size: 256 });
      expect(params(url).get("size")).toBe("256");
    });

    it("T2.4 - width is an alias for size", () => {
      const url = logoUrl("google.com", { width: 256 });
      expect(params(url).get("size")).toBe("256");
    });
  });

  // -----------------------------------------------------------------------
  // Size clamping (T2.5 - T2.8)
  // -----------------------------------------------------------------------
  describe("size options", () => {
    it("T2.5 - clamps size to 800 for publishable keys (no token or pk_/qt_ prefix)", () => {
      const url = logoUrl("x.com", { size: 2000 });
      expect(params(url).get("size")).toBe("800");
    });

    it("T2.6 - clamps size to 1200 for server keys (sk_ prefix)", () => {
      const url = logoUrl("x.com", { size: 2000, token: "sk_xxx" });
      expect(params(url).get("size")).toBe("1200");
    });

    it("T2.7 - size 0 falls back to default 128 and is omitted from URL", () => {
      const url = logoUrl("x.com", { size: 0 });
      expect(params(url).has("size")).toBe(false);
    });

    it("T2.8 - negative size falls back to default 128 and is omitted from URL", () => {
      const url = logoUrl("x.com", { size: -5 });
      expect(params(url).has("size")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Greyscale (T2.9 - T2.10)
  // -----------------------------------------------------------------------
  describe("greyscale option", () => {
    it("T2.9 - includes greyscale=1 when greyscale is true", () => {
      const url = logoUrl("x.com", { greyscale: true });
      expect(params(url).get("greyscale")).toBe("1");
    });

    it("T2.10 - omits greyscale param when false or undefined", () => {
      const urlFalse = logoUrl("x.com", { greyscale: false });
      expect(params(urlFalse).has("greyscale")).toBe(false);

      const urlUndefined = logoUrl("x.com");
      expect(params(urlUndefined).has("greyscale")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Theme (T2.11 - T2.14)
  // -----------------------------------------------------------------------
  describe("theme option", () => {
    it("T2.11 - includes theme=dark when theme is 'dark'", () => {
      const url = logoUrl("x.com", { theme: "dark" });
      expect(params(url).get("theme")).toBe("dark");
    });

    it("T2.12 - includes theme=light when theme is 'light'", () => {
      const url = logoUrl("x.com", { theme: "light" });
      expect(params(url).get("theme")).toBe("light");
    });

    it("T2.13 - omits theme param when undefined", () => {
      const url = logoUrl("x.com");
      expect(params(url).has("theme")).toBe(false);
    });

    it("T2.14 - omits theme param when value is invalid", () => {
       
      const url = logoUrl("x.com", { theme: "invalid" as unknown as ThemeOption });
      expect(params(url).has("theme")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Format (T2.15 - T2.19)
  // -----------------------------------------------------------------------
  describe("format option", () => {
    it("T2.15 - includes format=webp for shorthand 'webp'", () => {
      const url = logoUrl("x.com", { format: "webp" });
      expect(params(url).get("format")).toBe("webp");
    });

    it("T2.16 - strips image/ prefix from full MIME type 'image/avif'", () => {
      const url = logoUrl("x.com", { format: "image/avif" });
      expect(params(url).get("format")).toBe("avif");
    });

    it("T2.17 - includes format=jpeg for shorthand 'jpeg'", () => {
      const url = logoUrl("x.com", { format: "jpeg" });
      expect(params(url).get("format")).toBe("jpeg");
    });

    it("T2.18 - includes format=png for shorthand 'png'", () => {
      const url = logoUrl("x.com", { format: "png" });
      expect(params(url).get("format")).toBe("png");
    });

    it("T2.19 - omits format param for unsupported format values", () => {
       
      const url = logoUrl("x.com", { format: "image/gif" as unknown as SupportedOutputFormat });
      expect(params(url).has("format")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Variant (T2.23 - T2.25)
  // -----------------------------------------------------------------------
  describe("variant option", () => {
    it("T2.23 - includes variant=icon when variant is 'icon'", () => {
      const url = logoUrl("x.com", { variant: "icon" });
      expect(params(url).get("variant")).toBe("icon");
    });

    it("T2.24 - omits variant param when variant is 'full' (default)", () => {
      const url = logoUrl("x.com", { variant: "full" });
      expect(params(url).has("variant")).toBe(false);
    });

    it("T2.25 - omits variant param when undefined", () => {
      const url = logoUrl("x.com");
      expect(params(url).has("variant")).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // AutoScrape (T2.20) — always enabled
  // -----------------------------------------------------------------------
  describe("autoScrape", () => {
    it("T2.20 - always includes autoScrape=true", () => {
      const url = logoUrl("x.com");
      expect(params(url).get("autoScrape")).toBe("true");
    });
  });

  // -----------------------------------------------------------------------
  // Combined options (T2.22)
  // -----------------------------------------------------------------------
  describe("combined options", () => {
    it("T2.22 - includes all specified params when multiple options are set", () => {
      const url = logoUrl("google.com", {
        token: "pk_test",
        size: 512,
        greyscale: true,
        theme: "dark",
        format: "webp",
      });

      const p = params(url);
      expect(p.get("token")).toBe("pk_test");
      expect(p.get("size")).toBe("512");
      expect(p.get("greyscale")).toBe("1");
      expect(p.get("theme")).toBe("dark");
      expect(p.get("format")).toBe("webp");
      expect(p.get("autoScrape")).toBe("true");

      // Verify the base path is correct
      const parsed = new URL(url);
      expect(parsed.origin).toBe("https://logos.getquikturn.io");
      expect(parsed.pathname).toBe("/google.com");
    });
  });

  // -----------------------------------------------------------------------
  // Domain normalization (T2.23 - T2.25)
  // -----------------------------------------------------------------------
  describe("domain normalization", () => {
    it("T2.23 - lowercases the domain", () => {
      const url = logoUrl("Google.COM");
      expect(url).toContain("/google.com");
      expect(url).not.toContain("/Google");
    });

    it("T2.24 - trims whitespace from the domain", () => {
      const url = logoUrl(" google.com ");
      expect(new URL(url).pathname).toBe("/google.com");
    });

    it("T2.25 - strips trailing dot from the domain", () => {
      const url = logoUrl("google.com.");
      expect(new URL(url).pathname).toBe("/google.com");
    });
  });

  // -----------------------------------------------------------------------
  // Custom baseUrl (T2.26)
  // -----------------------------------------------------------------------
  describe("custom baseUrl", () => {
    it("T2.26 - overrides the default base URL", () => {
      const url = logoUrl("x.com", { baseUrl: "https://custom.api.com" });
      expect(url.startsWith("https://custom.api.com/x.com")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Domain validation errors (T2.27 - T2.34)
  // -----------------------------------------------------------------------
  describe("domain validation errors", () => {
    it("T2.27 - throws on empty domain", () => {
      expect(() => logoUrl("")).toThrow();
      expect(() => logoUrl("")).toThrow(
        expect.objectContaining({
          message: expect.any(String),
        }),
      );
      // Verify error class hierarchy
      try {
        logoUrl("");
      } catch (err) {
        expect(err).toBeInstanceOf(LogoError);
      }
    });

    it("T2.28 - throws when domain includes a protocol", () => {
      expect(() => logoUrl("https://google.com")).toThrow();
      try {
        logoUrl("https://google.com");
      } catch (err) {
        expect(err).toBeInstanceOf(DomainValidationError);
      }
    });

    it("T2.29 - throws when domain includes a path", () => {
      expect(() => logoUrl("google.com/path")).toThrow();
      try {
        logoUrl("google.com/path");
      } catch (err) {
        expect(err).toBeInstanceOf(DomainValidationError);
      }
    });

    it("T2.30 - throws on IP address", () => {
      expect(() => logoUrl("192.168.1.1")).toThrow();
      try {
        logoUrl("192.168.1.1");
      } catch (err) {
        expect(err).toBeInstanceOf(DomainValidationError);
      }
    });

    it("T2.31 - throws on localhost", () => {
      expect(() => logoUrl("localhost")).toThrow();
      try {
        logoUrl("localhost");
      } catch (err) {
        expect(err).toBeInstanceOf(DomainValidationError);
      }
    });

    it("T2.32 - throws when total domain length exceeds 253 characters", () => {
      const longDomain = "a".repeat(254) + ".com";
      expect(() => logoUrl(longDomain)).toThrow();
      try {
        logoUrl(longDomain);
      } catch (err) {
        expect(err).toBeInstanceOf(DomainValidationError);
      }
    });

    it("T2.33 - throws when a single label exceeds 63 characters", () => {
      const longLabel = "a".repeat(64) + ".com";
      expect(() => logoUrl(longLabel)).toThrow();
      try {
        logoUrl(longLabel);
      } catch (err) {
        expect(err).toBeInstanceOf(DomainValidationError);
      }
    });

    it("T2.34 - throws on domain with spaces or special characters", () => {
      expect(() => logoUrl("goo gle.com")).toThrow();
      try {
        logoUrl("goo gle.com");
      } catch (err) {
        expect(err).toBeInstanceOf(DomainValidationError);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Default param omission (T2.35 - T2.36)
  // -----------------------------------------------------------------------
  describe("default param omission", () => {
    it("T2.35 - omits size from URL when it equals the default (128)", () => {
      const url = logoUrl("x.com", { size: 128 });
      expect(params(url).has("size")).toBe(false);
    });

    it("T2.36 - omits token from URL when not provided", () => {
      const url = logoUrl("x.com");
      expect(params(url).has("token")).toBe(false);
      expect(url).not.toContain("token=");
    });
  });

  // -----------------------------------------------------------------------
  // Edge case domains (T2.37 - T2.41)
  // -----------------------------------------------------------------------
  describe("Edge case domains", () => {
    it("T2.37 - rejects domain with consecutive dots (empty label)", () => {
      expect(() => logoUrl("example..com")).toThrow(DomainValidationError);
    });

    it("T2.38 - rejects domain with port number", () => {
      expect(() => logoUrl("example.com:8080")).toThrow(DomainValidationError);
    });

    it("T2.39 - accepts valid punycode/IDN domain", () => {
      // xn--bcher-kva.example is valid punycode for buecher.example
      const url = logoUrl("xn--bcher-kva.example");
      expect(url).toContain("xn--bcher-kva.example");
    });

    it("T2.40 - rejects domain with only dots", () => {
      expect(() => logoUrl("...")).toThrow(DomainValidationError);
    });

    it("T2.41 - rejects single-label domain (no dot)", () => {
      // "localhost" is already tested, but test a generic single label
      expect(() => logoUrl("intranet")).toThrow(DomainValidationError);
    });
  });
});
