import { describe, it, expect, vi, afterEach } from "vitest";

import { parseAttributionStatus } from "../../src/client/attribution";

// ---------------------------------------------------------------------------
// Phase 4C - Attribution Helper (TDD)
//
// Tests define the contract for src/client/attribution.ts.
// The function parses X-Attribution-* response headers into a typed
// AttributionInfo object for free-tier consumers.
// ---------------------------------------------------------------------------

/**
 * Helper: constructs a Headers instance from a plain object.
 * Simplifies test setup by avoiding verbose `new Headers()` + `.set()` calls.
 */
function makeHeaders(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("parseAttributionStatus", () => {
  // Restore real timers after each test to prevent leaks.
  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Status → isValid mapping (T4.28 - T4.34)
  // -----------------------------------------------------------------------

  it("T4.28 - parses X-Attribution-Status 'verified' with isValid: true", () => {
    const result = parseAttributionStatus(
      makeHeaders({ "X-Attribution-Status": "verified" }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("verified");
    expect(result!.isValid).toBe(true);
  });

  it("T4.29 - parses 'pending' with isValid: true", () => {
    const result = parseAttributionStatus(
      makeHeaders({ "X-Attribution-Status": "pending" }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("pending");
    expect(result!.isValid).toBe(true);
  });

  it("T4.30 - parses 'grace-period' with valid (future) deadline as isValid: true", () => {
    // Pin time so the deadline is reliably in the future.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const futureDeadline = "2026-06-01T00:00:00Z";

    const result = parseAttributionStatus(
      makeHeaders({
        "X-Attribution-Status": "grace-period",
        "X-Attribution-Grace-Deadline": futureDeadline,
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("grace-period");
    expect(result!.graceDeadline).toBeInstanceOf(Date);
    expect(result!.graceDeadline!.getTime()).toBe(new Date(futureDeadline).getTime());
    expect(result!.isValid).toBe(true);
  });

  it("T4.31 - parses 'grace-period' with expired deadline as isValid: false", () => {
    // Pin time so the deadline is reliably in the past.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));

    const pastDeadline = "2026-01-01T00:00:00Z";

    const result = parseAttributionStatus(
      makeHeaders({
        "X-Attribution-Status": "grace-period",
        "X-Attribution-Grace-Deadline": pastDeadline,
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("grace-period");
    expect(result!.graceDeadline).toBeInstanceOf(Date);
    expect(result!.graceDeadline!.getTime()).toBe(new Date(pastDeadline).getTime());
    expect(result!.isValid).toBe(false);
  });

  it("T4.32 - parses 'unverified' with isValid: false", () => {
    const result = parseAttributionStatus(
      makeHeaders({ "X-Attribution-Status": "unverified" }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("unverified");
    expect(result!.isValid).toBe(false);
  });

  it("T4.33 - parses 'failed' with isValid: false", () => {
    const result = parseAttributionStatus(
      makeHeaders({ "X-Attribution-Status": "failed" }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("failed");
    expect(result!.isValid).toBe(false);
  });

  it("T4.34 - parses 'error' with isValid: false", () => {
    const result = parseAttributionStatus(
      makeHeaders({ "X-Attribution-Status": "error" }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("error");
    expect(result!.isValid).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Missing header (T4.35)
  // -----------------------------------------------------------------------

  it("T4.35 - returns null when X-Attribution-Status header is missing", () => {
    const result = parseAttributionStatus(makeHeaders({}));
    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Optional header parsing (supplementary)
  // -----------------------------------------------------------------------

  it("parses X-Attribution-Verified-At into a Date when present", () => {
    const verifiedAt = "2026-01-15T12:00:00Z";

    const result = parseAttributionStatus(
      makeHeaders({
        "X-Attribution-Status": "verified",
        "X-Attribution-Verified-At": verifiedAt,
      }),
    );

    expect(result).not.toBeNull();
    expect(result!.verifiedAt).toBeInstanceOf(Date);
    expect(result!.verifiedAt!.getTime()).toBe(new Date(verifiedAt).getTime());
  });

  it("omits verifiedAt when X-Attribution-Verified-At header is absent", () => {
    const result = parseAttributionStatus(
      makeHeaders({ "X-Attribution-Status": "verified" }),
    );

    expect(result).not.toBeNull();
    expect(result!.verifiedAt).toBeUndefined();
  });

  it("grace-period without a deadline header yields isValid: false", () => {
    const result = parseAttributionStatus(
      makeHeaders({ "X-Attribution-Status": "grace-period" }),
    );

    expect(result).not.toBeNull();
    expect(result!.status).toBe("grace-period");
    expect(result!.graceDeadline).toBeUndefined();
    expect(result!.isValid).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Unknown / invalid header values (runtime validation)
  // -----------------------------------------------------------------------

  it("Unknown X-Attribution-Status returns error status with isValid: false", () => {
    const headers = new Headers({ "X-Attribution-Status": "unknown-future-status" });
    const result = parseAttributionStatus(headers);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("error");
    expect(result!.isValid).toBe(false);
  });

  it("Invalid date in X-Attribution-Grace-Deadline returns undefined graceDeadline", () => {
    const headers = new Headers({
      "X-Attribution-Status": "grace-period",
      "X-Attribution-Grace-Deadline": "not-a-date",
    });
    const result = parseAttributionStatus(headers);
    expect(result).not.toBeNull();
    expect(result!.graceDeadline).toBeUndefined();
    // grace-period with no valid deadline -> isValid: false
    expect(result!.isValid).toBe(false);
  });
});
