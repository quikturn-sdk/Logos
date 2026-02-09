/**
 * @quikturn/logos SDK — Response Header Parser
 *
 * Parses structured metadata from Cloudflare Worker response headers into
 * strongly-typed SDK objects. The worker attaches cache status, rate-limit
 * counters, monthly quota info, and image transformation details as custom
 * `X-` headers on every successful response.
 *
 * Two public functions are exported:
 * - `parseLogoHeaders` — extracts a full `LogoMetadata` object.
 * - `parseRetryAfter`  — extracts the `Retry-After` value for 429 handling.
 */

import type { LogoMetadata } from "./types";

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parses an integer from a header value string.
 *
 * Returns `fallback` when the value is `null` or not a valid integer.
 * Overloaded so that a `number` fallback returns `number` and an `undefined`
 * fallback returns `number | undefined`, preserving type narrowing at call sites.
 */
function safeParseInt(value: string | null, fallback: number): number;
function safeParseInt(value: string | null, fallback: undefined): number | undefined;
function safeParseInt(value: string | null, fallback: number | undefined): number | undefined {
  if (value === null) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Safely parses a floating-point number from a header value string.
 *
 * Returns `fallback` when the value is `null` or not a valid number.
 */
function safeParseFloat(value: string | null, fallback: undefined): number | undefined {
  if (value === null) return fallback;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses Cloudflare Worker response headers into a `LogoMetadata` object.
 *
 * Extracts and normalizes the following header families:
 *
 * | Header                      | Field                           |
 * |-----------------------------|---------------------------------|
 * | `X-Cache-Status`            | `cache.status`                  |
 * | `X-RateLimit-Remaining`     | `rateLimit.remaining`           |
 * | `X-RateLimit-Reset`         | `rateLimit.reset` (as `Date`)   |
 * | `X-Quota-Remaining`         | `quota.remaining`               |
 * | `X-Quota-Limit`             | `quota.limit`                   |
 * | `X-Quikturn-Token`          | `tokenPrefix`                   |
 * | `X-Transformation-Applied`  | `transformation.applied`        |
 * | `X-Transformation-Status`   | `transformation.status`         |
 * | `X-Transformation-Method`   | `transformation.method`         |
 * | `X-Transformation-Width`    | `transformation.width`          |
 * | `X-Transformation-Greyscale`| `transformation.greyscale`      |
 * | `X-Transformation-Gamma`    | `transformation.gamma`          |
 *
 * Missing or unparseable numeric headers fall back to `0` for required fields
 * and `undefined` for optional fields. The cache status defaults to `"MISS"`
 * unless the header value is exactly `"HIT"`.
 *
 * @param headers - The `Headers` object from a fetch `Response`.
 * @returns A fully-populated `LogoMetadata` object.
 *
 * @example
 * ```ts
 * const response = await fetch(logoUrl("github.com"));
 * const metadata = parseLogoHeaders(response.headers);
 * console.log(metadata.cache.status); // "HIT" or "MISS"
 * ```
 */
export function parseLogoHeaders(headers: Headers): LogoMetadata {
  // Cache
  const cacheStatus = headers.get("X-Cache-Status");

  // Rate limit
  const rateLimitRemaining = safeParseInt(headers.get("X-RateLimit-Remaining"), 0);
  const rateLimitReset = safeParseInt(headers.get("X-RateLimit-Reset"), 0);

  // Quota
  const quotaRemaining = safeParseInt(headers.get("X-Quota-Remaining"), 0);
  const quotaLimit = safeParseInt(headers.get("X-Quota-Limit"), 0);

  // Token
  const tokenPrefix = headers.get("X-Quikturn-Token") ?? undefined;

  // Transformation
  const transformApplied = headers.get("X-Transformation-Applied") === "true";

  const VALID_TRANSFORM_STATUSES = new Set([
    "not-requested",
    "unsupported-format",
    "transformation-error",
  ]);
  const rawTransformStatus = headers.get("X-Transformation-Status");
  const transformStatus =
    rawTransformStatus && VALID_TRANSFORM_STATUSES.has(rawTransformStatus)
      ? (rawTransformStatus as LogoMetadata["transformation"]["status"])
      : undefined;

  const rawTransformMethod = headers.get("X-Transformation-Method");
  const transformMethod =
    rawTransformMethod === "images-binding" ? "images-binding" : undefined;
  const transformWidth = safeParseInt(headers.get("X-Transformation-Width"), undefined);
  const transformGreyscale =
    headers.get("X-Transformation-Greyscale") === "true" ? true : undefined;
  const transformGamma = safeParseFloat(headers.get("X-Transformation-Gamma"), undefined);

  return {
    cache: { status: cacheStatus === "HIT" ? "HIT" : "MISS" },
    rateLimit: {
      remaining: rateLimitRemaining,
      reset: new Date(rateLimitReset * 1000),
    },
    quota: {
      remaining: quotaRemaining,
      limit: quotaLimit,
    },
    transformation: {
      applied: transformApplied,
      ...(transformStatus ? { status: transformStatus } : {}),
      ...(transformMethod ? { method: transformMethod } : {}),
      ...(transformWidth !== undefined ? { width: transformWidth } : {}),
      ...(transformGreyscale !== undefined ? { greyscale: transformGreyscale } : {}),
      ...(transformGamma !== undefined ? { gamma: transformGamma } : {}),
    },
    ...(tokenPrefix !== undefined ? { tokenPrefix } : {}),
  };
}

/**
 * Parses the `Retry-After` response header into a numeric value (seconds).
 *
 * The Logos API always sends `Retry-After` as an integer number of seconds
 * (not an HTTP-date). Returns `null` when the header is absent or its value
 * cannot be parsed as a finite number.
 *
 * @param headers - The `Headers` object from a fetch `Response`.
 * @returns The retry delay in seconds, or `null` if not present.
 *
 * @example
 * ```ts
 * const retryAfter = parseRetryAfter(response.headers);
 * if (retryAfter !== null) {
 *   await new Promise((r) => setTimeout(r, retryAfter * 1000));
 * }
 * ```
 */
export function parseRetryAfter(headers: Headers): number | null {
  const value = headers.get("Retry-After");
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
