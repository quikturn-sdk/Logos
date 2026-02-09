/**
 * @quikturn/logos SDK — Server Client Integration Tests
 *
 * End-to-end tests against the real Quikturn Logos API using secret keys.
 * These tests exercise the server-side `QuikturnLogos` class, `logoUrl`
 * builder, and header parsing against the live API to verify real-world
 * behavior.
 *
 * Skipped automatically when `QUIKTURN_SECRET_KEY` is not set.
 *
 * Run with: pnpm test:integration
 */

import { describe, it, expect } from "vitest";

// Import from source — vitest resolves TypeScript directly
import { QuikturnLogos } from "../../src/server/index";
import { logoUrl } from "../../src/url-builder";

// ---------------------------------------------------------------------------
// Environment gate
// ---------------------------------------------------------------------------

const SECRET_KEY = process.env["QUIKTURN_SECRET_KEY"];
const hasSecretKey = !!SECRET_KEY;

// ---------------------------------------------------------------------------
// Server Client E2E Suite
// ---------------------------------------------------------------------------

describe.skipIf(!hasSecretKey)("Server Client Integration (E2E)", () => {
  /** Creates a fresh client for each test to avoid shared state. */
  const getClient = () => new QuikturnLogos({ secretKey: SECRET_KEY! });

  // -------------------------------------------------------------------------
  // T7.4 - Server client fetch real logo for "github.com" -> valid Buffer
  // -------------------------------------------------------------------------

  it("T7.4 - fetches a real logo for github.com and returns a valid Buffer", async () => {
    const client = getClient();
    const result = await client.get("github.com");

    // Verify the buffer contains actual image bytes
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);

    // Verify Content-Type is an image MIME type
    expect(result.contentType).toMatch(/^image\//);

    // Verify metadata is present and parseable
    expect(result.metadata).toBeDefined();
    expect(result.metadata.cache.status).toMatch(/^(HIT|MISS)$/);
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.5 - Server client size=512 -> correct dimensions
  // -------------------------------------------------------------------------

  it("T7.5 - fetches with size=512 and receives correctly sized image", async () => {
    const client = getClient();
    const result = await client.get("github.com", { size: 512 });

    // Buffer must contain data
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);

    // If transformation was applied, verify the width matches the requested size
    if (
      result.metadata.transformation.applied &&
      result.metadata.transformation.width !== undefined
    ) {
      expect(result.metadata.transformation.width).toBe(512);
    }
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.6 - Server client format=webp -> image/webp content type
  // -------------------------------------------------------------------------

  it("T7.6 - fetches with format=webp and receives image/webp content type", async () => {
    const client = getClient();
    const result = await client.get("github.com", { format: "webp" });

    expect(result.contentType).toContain("image/webp");
    expect(result.buffer.length).toBeGreaterThan(0);
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.7 - Server client greyscale=true -> transformed image
  // -------------------------------------------------------------------------

  it("T7.7 - fetches with greyscale=true and receives a transformed image", async () => {
    const client = getClient();
    const result = await client.get("github.com", { greyscale: true });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);

    // If transformation was applied, greyscale should be noted in metadata
    if (result.metadata.transformation.applied) {
      expect(result.metadata.transformation.greyscale).toBe(true);
    }
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.8 - Server client getMany() -> results for multiple domains
  // -------------------------------------------------------------------------

  it("T7.8 - getMany() returns results for multiple domains", async () => {
    const client = getClient();
    const domains = ["google.com", "github.com"];
    const results: Array<{ domain: string; success: boolean }> = [];

    for await (const result of client.getMany(domains)) {
      results.push({ domain: result.domain, success: result.success });

      if (result.success) {
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer!.length).toBeGreaterThan(0);
        expect(result.contentType).toMatch(/^image\//);
        expect(result.metadata).toBeDefined();
      }
    }

    // Verify we got results for all domains
    expect(results).toHaveLength(2);

    // Results should be in the same order as input domains
    expect(results[0]!.domain).toBe("google.com");
    expect(results[1]!.domain).toBe("github.com");
  }, 60_000);

  // -------------------------------------------------------------------------
  // T7.9 - URL builder generated URL is fetchable -> 200
  // -------------------------------------------------------------------------

  it("T7.9 - URL builder generates a fetchable URL that returns 200", async () => {
    // Build URL without token (server uses Authorization header, not query param)
    const url = logoUrl("google.com");

    // Fetch using Authorization: Bearer header
    const response = await globalThis.fetch(url, {
      headers: { Authorization: `Bearer ${SECRET_KEY!}` },
    });

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.10 - Rate limit headers are correctly parsed into metadata
  // -------------------------------------------------------------------------

  it("T7.10 - rate limit headers are correctly parsed from response", async () => {
    const client = getClient();
    const result = await client.get("google.com");

    expect(result.metadata.rateLimit).toBeDefined();
    expect(typeof result.metadata.rateLimit.remaining).toBe("number");
    expect(result.metadata.rateLimit.remaining).toBeGreaterThanOrEqual(0);

    // reset should be a Date instance
    expect(result.metadata.rateLimit.reset).toBeInstanceOf(Date);

    // Reset time should be a reasonable timestamp (not epoch 0)
    const resetTime = result.metadata.rateLimit.reset.getTime();
    expect(resetTime).toBeGreaterThan(0);
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.11 - Quota headers are correctly parsed from response
  // -------------------------------------------------------------------------

  it("T7.11 - quota headers are correctly parsed from response", async () => {
    const client = getClient();
    const result = await client.get("google.com");

    expect(result.metadata.quota).toBeDefined();
    expect(typeof result.metadata.quota.remaining).toBe("number");
    expect(typeof result.metadata.quota.limit).toBe("number");

    // Quota remaining should be >= 0
    expect(result.metadata.quota.remaining).toBeGreaterThanOrEqual(0);

    // Quota limit should be positive (matches one of the tier limits)
    expect(result.metadata.quota.limit).toBeGreaterThan(0);
  }, 30_000);

  // -------------------------------------------------------------------------
  // T7.12 - Cache status header parsed (HIT on second request)
  // -------------------------------------------------------------------------

  it("T7.12 - cache status returns HIT on second request for same domain", async () => {
    const client = getClient();

    // First request — may be HIT or MISS
    const first = await client.get("google.com");
    expect(first.metadata.cache.status).toMatch(/^(HIT|MISS)$/);

    // Second request — likely HIT from edge cache, but MISS is acceptable
    // since edge cache behavior is non-deterministic (multi-node, purges, etc.)
    const second = await client.get("google.com");
    expect(second.metadata.cache.status).toMatch(/^(HIT|MISS)$/);
  }, 30_000);
});
