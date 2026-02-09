/**
 * @quikturn/logos SDK — Browser Client Integration Tests
 *
 * End-to-end tests against the real Quikturn Logos API using publishable keys.
 * These tests exercise the browser-side `browserFetch` function and `logoUrl`
 * builder against the live API to verify real-world behavior.
 *
 * NOTE: These tests run in Node.js environment (not jsdom) because:
 * 1. Node 18+ provides a native fetch API compatible with browser fetch
 * 2. These are API contract tests, not browser-specific behavior tests
 * 3. We test `browserFetch` directly (not the full QuikturnLogos class which
 *    requires `URL.createObjectURL`, a browser-only API)
 *
 * Skipped automatically when `QUIKTURN_PUBLISHABLE_KEY` is not set.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect } from "vitest";

// Import from source — vitest resolves TypeScript directly
import { browserFetch } from "../../src/client/fetcher";
import { logoUrl } from "../../src/url-builder";
import { NotFoundError, AuthenticationError } from "../../src/errors";
import { parseLogoHeaders } from "../../src/headers";

// ---------------------------------------------------------------------------
// Environment gate
// ---------------------------------------------------------------------------

const PUBLISHABLE_KEY = process.env["QUIKTURN_PUBLISHABLE_KEY"];
const hasKey = !!PUBLISHABLE_KEY;

// ---------------------------------------------------------------------------
// Browser Client E2E Suite
// ---------------------------------------------------------------------------

describe.skipIf(!hasKey)("Browser Client Integration (E2E)", () => {
  // -------------------------------------------------------------------------
  // T7.1 - Fetch a real logo for a well-known domain
  // -------------------------------------------------------------------------

  it("T7.1 - fetches a real logo for google.com and returns valid image data", async () => {
    const url = logoUrl("google.com", { token: PUBLISHABLE_KEY! });
    const response = await browserFetch(url);

    // Verify successful response
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    // Verify Content-Type is an image MIME type
    const contentType = response.headers.get("Content-Type");
    expect(contentType).toMatch(/^image\//);

    // Verify the body contains actual image bytes
    const blob = await response.blob();
    expect(blob.size).toBeGreaterThan(0);

    // Verify metadata headers are present and parseable
    const metadata = parseLogoHeaders(response.headers);
    expect(metadata.cache.status).toMatch(/^(HIT|MISS)$/);
    expect(metadata.rateLimit.remaining).toBeGreaterThanOrEqual(0);
    expect(metadata.quota.remaining).toBeGreaterThanOrEqual(0);
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.2 - Unknown domain returns NotFoundError
  // -------------------------------------------------------------------------

  it("T7.2 - throws NotFoundError for an unknown/nonexistent domain", async () => {
    // Use .invalid TLD per RFC 6761 — guaranteed to never resolve
    const url = logoUrl(
      "nonexistent-test.invalid",
      { token: PUBLISHABLE_KEY! },
    );

    await expect(browserFetch(url)).rejects.toThrow(NotFoundError);
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.3 - Invalid token returns AuthenticationError
  // -------------------------------------------------------------------------

  it("T7.3 - throws AuthenticationError for an invalid token", async () => {
    const url = logoUrl("google.com", { token: "qt_invalid_token_12345" });

    await expect(browserFetch(url)).rejects.toThrow(AuthenticationError);
  }, 30_000);
});
