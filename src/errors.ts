/**
 * @quikturn/logos SDK — Error Classes
 *
 * Structured error hierarchy for the Logos SDK. All errors extend LogoError,
 * which itself extends the native Error class with a machine-readable `code`
 * and an optional HTTP `status`.
 *
 * The Object.setPrototypeOf pattern is required to restore the prototype chain
 * when extending built-in classes (Error) under ES5 downlevel emit, ensuring
 * `instanceof` checks work correctly in all environments.
 */

import type { LogoErrorCode } from "./types";

// ---------------------------------------------------------------------------
// Base Error
// ---------------------------------------------------------------------------

/**
 * Base error class for all Logos SDK errors.
 *
 * Every error carries a human-readable `message`, a machine-readable `code`
 * (a {@link LogoErrorCode} discriminated union), and an optional HTTP `status` code.
 */
export class LogoError extends Error {
  code: LogoErrorCode;
  status?: number;

  constructor(message: string, code: LogoErrorCode, status?: number) {
    super(message);
    this.name = "LogoError";
    this.code = code;
    this.status = status;
    // Fix prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Domain Validation
// ---------------------------------------------------------------------------

/**
 * Thrown when a domain string fails RFC 1035/1123 validation.
 *
 * Includes the invalid `domain` for diagnostic purposes.
 */
export class DomainValidationError extends LogoError {
  domain: string;

  constructor(message: string, domain: string) {
    super(message, "DOMAIN_VALIDATION_ERROR");
    this.name = "DomainValidationError";
    this.domain = domain;
  }
}

// ---------------------------------------------------------------------------
// Rate Limiting & Quota
// ---------------------------------------------------------------------------

/**
 * Thrown when a per-minute rate limit is exceeded (HTTP 429).
 *
 * - `retryAfter` — seconds until the next request will be accepted.
 * - `remaining`  — requests remaining in the current window (always 0).
 * - `resetAt`    — Date when the rate-limit window resets.
 */
export class RateLimitError extends LogoError {
  retryAfter: number;
  remaining: number;
  resetAt: Date;

  constructor(message: string, retryAfter: number, remaining: number, resetAt: Date) {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    this.remaining = remaining;
    this.resetAt = resetAt;
  }
}

/**
 * Thrown when the monthly request quota is exhausted (HTTP 429).
 *
 * - `retryAfter` — seconds until the quota resets (beginning of next month).
 * - `limit`      — total monthly quota for the current tier.
 * - `used`       — number of requests consumed so far this month.
 */
export class QuotaExceededError extends LogoError {
  retryAfter: number;
  limit: number;
  used: number;

  constructor(message: string, retryAfter: number, limit: number, used: number) {
    super(message, "QUOTA_EXCEEDED_ERROR", 429);
    this.name = "QuotaExceededError";
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.used = used;
  }
}

// ---------------------------------------------------------------------------
// Authentication & Authorization
// ---------------------------------------------------------------------------

/**
 * Thrown when the API token is missing, malformed, or expired (HTTP 401).
 */
export class AuthenticationError extends LogoError {
  constructor(message: string) {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

/**
 * Thrown when the API token is valid but lacks permission for the
 * requested operation (HTTP 403).
 *
 * - `reason` — machine-readable explanation (e.g. "tier_too_low").
 */
export class ForbiddenError extends LogoError {
  reason: string;

  constructor(message: string, reason: string) {
    super(message, "FORBIDDEN_ERROR", 403);
    this.name = "ForbiddenError";
    this.reason = reason;
  }
}

// ---------------------------------------------------------------------------
// Not Found
// ---------------------------------------------------------------------------

/**
 * Thrown when no logo exists for the requested domain and auto-scrape
 * is not enabled (HTTP 404).
 *
 * - `domain` — the domain that was looked up.
 */
export class NotFoundError extends LogoError {
  domain: string;

  constructor(message: string, domain: string) {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "NotFoundError";
    this.domain = domain;
  }
}

// ---------------------------------------------------------------------------
// Scrape Timeout
// ---------------------------------------------------------------------------

/**
 * Thrown when a background scrape job exceeds the configured polling timeout.
 *
 * - `jobId`   — the unique identifier of the timed-out scrape job.
 * - `elapsed` — milliseconds elapsed before the timeout was triggered.
 */
export class ScrapeTimeoutError extends LogoError {
  jobId: string;
  elapsed: number;

  constructor(message: string, jobId: string, elapsed: number) {
    super(message, "SCRAPE_TIMEOUT_ERROR");
    this.name = "ScrapeTimeoutError";
    this.jobId = jobId;
    this.elapsed = elapsed;
  }
}

// ---------------------------------------------------------------------------
// Bad Request
// ---------------------------------------------------------------------------

/**
 * Thrown when the request is malformed or contains invalid parameters (HTTP 400).
 */
export class BadRequestError extends LogoError {
  constructor(message: string) {
    super(message, "BAD_REQUEST_ERROR", 400);
    this.name = "BadRequestError";
  }
}
