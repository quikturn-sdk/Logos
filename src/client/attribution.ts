/**
 * @quikturn/logos SDK — Attribution Header Parser
 *
 * Parses attribution-related response headers returned by the Cloudflare Worker
 * for free-tier consumers. The worker attaches these headers to indicate whether
 * the consumer has properly attributed Quikturn on their site.
 *
 * | Header                           | Field           |
 * |----------------------------------|-----------------|
 * | `X-Attribution-Status`           | `status`        |
 * | `X-Attribution-Grace-Deadline`   | `graceDeadline` |
 * | `X-Attribution-Verified-At`      | `verifiedAt`    |
 *
 * The derived `isValid` field is computed from the status:
 * - "verified"     -> true
 * - "pending"      -> true
 * - "grace-period" -> true only if graceDeadline exists and is in the future
 * - "unverified"   -> false
 * - "failed"       -> false
 * - "error"        -> false
 */

import type { AttributionInfo, AttributionStatus } from "../types";

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/** Set of statuses that are unconditionally valid (no further checks needed). */
const ALWAYS_VALID_STATUSES: ReadonlySet<AttributionStatus> = new Set([
  "verified",
  "pending",
]);

/**
 * Safely parses an ISO 8601 date string into a `Date` instance.
 *
 * Returns `undefined` when the value is `null` or produces an invalid Date.
 */
function safeParseDate(value: string | null): Date | undefined {
  if (value === null) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Computes the derived `isValid` flag for an attribution status.
 *
 * - "verified" and "pending" are always valid.
 * - "grace-period" is valid only while the grace deadline is in the future.
 * - All other statuses ("unverified", "failed", "error") are invalid.
 */
function computeIsValid(
  status: AttributionStatus,
  graceDeadline: Date | undefined,
): boolean {
  if (ALWAYS_VALID_STATUSES.has(status)) return true;

  if (status === "grace-period") {
    return graceDeadline !== undefined && graceDeadline.getTime() > Date.now();
  }

  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses attribution response headers into a typed `AttributionInfo` object.
 *
 * Returns `null` when the `X-Attribution-Status` header is absent, indicating
 * that the response is not from a free-tier request (attribution does not apply).
 *
 * @param headers - The `Headers` object from a fetch `Response`.
 * @returns An `AttributionInfo` object, or `null` if no attribution header is present.
 */
export function parseAttributionStatus(headers: Headers): AttributionInfo | null {
  const rawStatus = headers.get("X-Attribution-Status");

  // No attribution header means this is not a free-tier response.
  if (rawStatus === null) return null;

  const status = rawStatus as AttributionStatus;
  const graceDeadline = safeParseDate(headers.get("X-Attribution-Grace-Deadline"));
  const verifiedAt = safeParseDate(headers.get("X-Attribution-Verified-At"));
  const isValid = computeIsValid(status, graceDeadline);

  return {
    status,
    isValid,
    ...(graceDeadline !== undefined ? { graceDeadline } : {}),
    ...(verifiedAt !== undefined ? { verifiedAt } : {}),
  };
}
