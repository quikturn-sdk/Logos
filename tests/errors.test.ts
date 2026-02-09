import { describe, it, expect } from "vitest";

import {
  LogoError,
  DomainValidationError,
  RateLimitError,
  QuotaExceededError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ScrapeTimeoutError,
  BadRequestError,
} from "../src/errors";

// ---------------------------------------------------------------------------
// Phase 3 - Error Classes (T3.1 - T3.13)
//
// These tests validate the structured error hierarchy defined in
// src/errors.ts. Every error extends LogoError which itself extends the
// native Error class with a machine-readable `code` and optional `status`.
// ---------------------------------------------------------------------------

describe("LogoError", () => {
  // -----------------------------------------------------------------------
  // Base error construction (T3.1, T3.2)
  // -----------------------------------------------------------------------
  it("T3.1 - has message, code, and is an instance of Error", () => {
    const err = new LogoError("test", "UNEXPECTED_ERROR");

    expect(err.message).toBe("test");
    expect(err.code).toBe("UNEXPECTED_ERROR");
    expect(err).toBeInstanceOf(Error);
  });

  it("T3.2 - name property equals 'LogoError'", () => {
    const err = new LogoError("test", "UNEXPECTED_ERROR");

    expect(err.name).toBe("LogoError");
  });
});

describe("RateLimitError", () => {
  // -----------------------------------------------------------------------
  // T3.3, T3.4
  // -----------------------------------------------------------------------
  const resetDate = new Date("2026-03-01T00:00:00Z");

  it("T3.3 - is an instance of LogoError", () => {
    const err = new RateLimitError("rate limited", 60, 0, resetDate);

    expect(err).toBeInstanceOf(LogoError);
  });

  it("T3.4 - has retryAfter (number), remaining (number), and resetAt (Date)", () => {
    const err = new RateLimitError("rate limited", 60, 0, resetDate);

    expect(err).toHaveProperty("retryAfter", 60);
    expect(err).toHaveProperty("remaining", 0);
    expect(err).toHaveProperty("resetAt", resetDate);

    // Verify types explicitly
    expect(typeof err.retryAfter).toBe("number");
    expect(typeof err.remaining).toBe("number");
    expect(err.resetAt).toBeInstanceOf(Date);

    // Verify code and status
    expect(err.code).toBe("RATE_LIMIT_ERROR");
    expect(err.status).toBe(429);
  });
});

describe("QuotaExceededError", () => {
  // -----------------------------------------------------------------------
  // T3.5, T3.6
  // -----------------------------------------------------------------------
  it("T3.5 - is an instance of LogoError", () => {
    const err = new QuotaExceededError("quota exceeded", 86400, 500_000, 500_000);

    expect(err).toBeInstanceOf(LogoError);
  });

  it("T3.6 - has retryAfter, limit, and used properties", () => {
    const err = new QuotaExceededError("quota exceeded", 86400, 500_000, 500_000);

    expect(err).toHaveProperty("retryAfter", 86400);
    expect(err).toHaveProperty("limit", 500_000);
    expect(err).toHaveProperty("used", 500_000);

    // Verify code and status
    expect(err.code).toBe("QUOTA_EXCEEDED_ERROR");
    expect(err.status).toBe(429);
  });
});

describe("AuthenticationError", () => {
  // -----------------------------------------------------------------------
  // T3.7
  // -----------------------------------------------------------------------
  it("T3.7 - is an instance of LogoError with status 401", () => {
    const err = new AuthenticationError("auth fail");

    expect(err).toBeInstanceOf(LogoError);
    expect(err.status).toBe(401);
    expect(err.message).toBe("auth fail");
    expect(err.code).toBe("AUTHENTICATION_ERROR");
  });
});

describe("ForbiddenError", () => {
  // -----------------------------------------------------------------------
  // T3.8
  // -----------------------------------------------------------------------
  it("T3.8 - is an instance of LogoError with status 403 and reason", () => {
    const err = new ForbiddenError("forbidden", "tier_too_low");

    expect(err).toBeInstanceOf(LogoError);
    expect(err.status).toBe(403);
    expect(err.reason).toBe("tier_too_low");
    expect(err.message).toBe("forbidden");
    expect(err.code).toBe("FORBIDDEN_ERROR");
  });
});

describe("NotFoundError", () => {
  // -----------------------------------------------------------------------
  // T3.9
  // -----------------------------------------------------------------------
  it("T3.9 - is an instance of LogoError with status 404", () => {
    const err = new NotFoundError("not found", "example.com");

    expect(err).toBeInstanceOf(LogoError);
    expect(err.status).toBe(404);
    expect(err.domain).toBe("example.com");
    expect(err.message).toBe("not found");
    expect(err.code).toBe("NOT_FOUND_ERROR");
  });
});

describe("ScrapeTimeoutError", () => {
  // -----------------------------------------------------------------------
  // T3.10
  // -----------------------------------------------------------------------
  it("T3.10 - is an instance of LogoError with jobId and elapsed", () => {
    const err = new ScrapeTimeoutError("timeout", "job123", 30000);

    expect(err).toBeInstanceOf(LogoError);
    expect(err).toHaveProperty("jobId", "job123");
    expect(err).toHaveProperty("elapsed", 30000);
    expect(err.message).toBe("timeout");
    expect(err.code).toBe("SCRAPE_TIMEOUT_ERROR");
  });
});

describe("DomainValidationError", () => {
  // -----------------------------------------------------------------------
  // T3.11
  // -----------------------------------------------------------------------
  it("T3.11 - is an instance of LogoError with domain property", () => {
    const err = new DomainValidationError("bad domain", "!!!.com");

    expect(err).toBeInstanceOf(LogoError);
    expect(err).toHaveProperty("domain", "!!!.com");
    expect(err.message).toBe("bad domain");
    expect(err.code).toBe("DOMAIN_VALIDATION_ERROR");
  });
});

describe("BadRequestError", () => {
  // -----------------------------------------------------------------------
  // T3.14, T3.15
  // -----------------------------------------------------------------------
  it("T3.14 - is an instance of LogoError", () => {
    const err = new BadRequestError("invalid parameters");

    expect(err).toBeInstanceOf(LogoError);
  });

  it("T3.15 - has status 400 and correct code", () => {
    const err = new BadRequestError("invalid parameters");

    expect(err.status).toBe(400);
    expect(err.code).toBe("BAD_REQUEST_ERROR");
    expect(err.message).toBe("invalid parameters");
    expect(err.name).toBe("BadRequestError");
  });
});

// ---------------------------------------------------------------------------
// Common behavior across all error classes (T3.12, T3.13)
// ---------------------------------------------------------------------------

describe("common behavior", () => {
  const resetDate = new Date("2026-03-01T00:00:00Z");

  /**
   * All error class instances to validate shared behavior.
   * Each entry is a [label, instance] tuple for readable test output.
   */
  const errorInstances: [string, LogoError][] = [
    ["LogoError", new LogoError("base error", "UNEXPECTED_ERROR")],
    ["DomainValidationError", new DomainValidationError("bad domain", "!!!.com")],
    ["RateLimitError", new RateLimitError("rate limited", 60, 0, resetDate)],
    ["QuotaExceededError", new QuotaExceededError("quota exceeded", 86400, 500_000, 500_000)],
    ["AuthenticationError", new AuthenticationError("auth fail")],
    ["ForbiddenError", new ForbiddenError("forbidden", "tier_too_low")],
    ["NotFoundError", new NotFoundError("not found", "example.com")],
    ["ScrapeTimeoutError", new ScrapeTimeoutError("timeout", "job123", 30000)],
    ["BadRequestError", new BadRequestError("bad request")],
  ];

  it("T3.12 - all error classes are instances of Error", () => {
    for (const [label, err] of errorInstances) {
      expect(err, `${label} should be instanceof Error`).toBeInstanceOf(Error);
    }
  });

  it("T3.13 - all error classes preserve stack trace", () => {
    for (const [label, err] of errorInstances) {
      expect(err.stack, `${label} should have a defined stack`).toBeDefined();
      expect(typeof err.stack, `${label} stack should be a string`).toBe("string");
    }
  });
});
