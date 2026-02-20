/**
 * @quikturn/logos SDK — Public Type Definitions
 *
 * All types mirror the Cloudflare Worker's type system exactly.
 * This file contains only type-level constructs (no runtime code).
 *
 * Source of truth: cf-worker-logos/src/types.ts, options.ts, rateLimit.ts, monthlyQuota.ts
 */

// ---------------------------------------------------------------------------
// Key & Auth Types
// ---------------------------------------------------------------------------

/** Distinguishes between publishable (browser-safe) and secret (server-only) keys. */
export type KeyType = "publishable" | "secret";

/** Valid key prefixes used to identify key type from the token string. */
export type KeyPrefix = "qt_" | "pk_" | "sk_";

/** Subscription tier determining rate limits, monthly quotas, and max image width. */
export type Tier = "free" | "launch" | "growth" | "enterprise";

/** Current lifecycle status of an API token. */
export type TokenStatus = "active" | "suspended" | "revoked";

// ---------------------------------------------------------------------------
// Request Types
// ---------------------------------------------------------------------------

/** Theme adjusts the gamma curve applied during image transformation. */
export type ThemeOption = "light" | "dark";

/** Logo variant: "full" for the standard logo, "icon" for the favicon/icon version. */
export type LogoVariant = "full" | "icon";

/** Full MIME-type output formats supported by the worker's image pipeline. */
export type SupportedOutputFormat = "image/png" | "image/jpeg" | "image/webp" | "image/avif";

/** Shorthand aliases accepted in query parameters and SDK options. */
export type FormatShorthand = "png" | "jpeg" | "webp" | "avif";

/**
 * Options accepted by the URL builder and both client classes.
 *
 * - `token`      — Publishable key (qt_/pk_) appended as a query parameter.
 * - `size`       — Output width in pixels. Clamped to 1..800 (publishable) or 1..1200 (secret). Default: 128.
 * - `width`      — Alias for `size`.
 * - `greyscale`  — When true, applies saturation: 0 transformation. Default: false.
 * - `theme`      — "light" (gamma 0.9) or "dark" (gamma 1.12).
 * - `format`     — Output image format. Accepts full MIME type or shorthand. Default: "image/png".
 * - `variant`    — "full" (default) for the standard logo, "icon" for the favicon/icon version.
 * - `autoScrape` — When true, triggers a background scrape if no logo is found. Default: false.
 * - `baseUrl`    — Override the default API base URL. Useful for testing or proxied environments.
 */
export interface LogoRequestOptions {
  token?: string;
  size?: number;
  width?: number;
  greyscale?: boolean;
  theme?: ThemeOption;
  format?: SupportedOutputFormat | FormatShorthand;
  variant?: LogoVariant;
  autoScrape?: boolean;
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------

/**
 * Structured metadata parsed from the worker's response headers.
 *
 * Every successful response includes cache, rate-limit, and quota information.
 * Transformation metadata is present when the image pipeline processes the request.
 */
export interface LogoMetadata {
  cache: { status: "HIT" | "MISS" };
  rateLimit: { remaining: number; reset: Date };
  quota: { remaining: number; limit: number };
  transformation: {
    applied: boolean;
    status?: "not-requested" | "unsupported-format" | "transformation-error";
    method?: "images-binding";
    width?: number;
    greyscale?: boolean;
    gamma?: number;
  };
  tokenPrefix?: string;
}

/**
 * Response shape returned by the browser client's `get()` method.
 *
 * - `url`         — A `blob:` object URL suitable for `<img src>`.
 * - `blob`        — The raw image Blob for further processing.
 * - `contentType` — MIME type of the image (e.g. "image/webp").
 * - `metadata`    — Parsed response headers (cache, rate-limit, quota, transformation).
 */
export interface BrowserLogoResponse {
  url: string;
  blob: Blob;
  contentType: string;
  metadata: LogoMetadata;
}

/**
 * Response shape returned by the server client's `get()` method.
 *
 * - `buffer`      — Raw image bytes as a Node.js Buffer.
 * - `contentType` — MIME type of the image (e.g. "image/png").
 * - `metadata`    — Parsed response headers (cache, rate-limit, quota, transformation).
 */
export interface ServerLogoResponse {
  buffer: Buffer;
  contentType: string;
  metadata: LogoMetadata;
}

// ---------------------------------------------------------------------------
// Auto-scrape Types
// ---------------------------------------------------------------------------

/**
 * Describes a background scrape job returned in a 202 response.
 *
 * - `jobId`           — Unique identifier for the scrape job.
 * - `pollUrl`         — URL to poll for scrape progress.
 * - `estimatedWaitMs` — Estimated time in milliseconds before the scrape completes.
 */
export interface ScrapeJob {
  jobId: string;
  pollUrl: string;
  estimatedWaitMs: number;
}

/**
 * The JSON body returned by the worker when a 202 (scrape pending) response is issued.
 *
 * - `status`      — Always "scrape_pending".
 * - `message`     — Human-readable status message.
 * - `companyId`   — Optional identifier of the matched company.
 * - `companyName` — Optional name of the matched company.
 * - `scrapeJob`   — Details for polling the scrape job.
 */
export interface ScrapePendingResponse {
  status: "scrape_pending";
  message: string;
  companyId?: number;
  companyName?: string;
  scrapeJob: ScrapeJob;
}

/** Lifecycle status of a background scrape job. */
export type ScrapeJobStatus = "pending" | "complete" | "failed";

/**
 * Event emitted during scrape polling to report progress.
 *
 * - `status`   — Current job status.
 * - `progress` — Optional progress percentage (0-100).
 * - `logo`     — Present when status is "complete"; contains the scraped logo details.
 * - `error`    — Present when status is "failed"; contains the error message.
 */
export interface ScrapeProgressEvent {
  status: ScrapeJobStatus;
  progress?: number;
  logo?: { id: number; url: string; companyId: number; companyName: string };
  error?: string;
}

// ---------------------------------------------------------------------------
// Attribution Types (free tier)
// ---------------------------------------------------------------------------

/**
 * Possible attribution verification states for free-tier consumers.
 *
 * - "verified"     — Attribution confirmed and valid.
 * - "pending"      — Verification in progress; treated as valid.
 * - "unverified"   — Attribution not yet set up.
 * - "failed"       — Verification attempted but failed.
 * - "grace-period" — Temporary grace; validity depends on graceDeadline.
 * - "error"        — An error occurred during verification.
 */
export type AttributionStatus = "verified" | "pending" | "unverified" | "failed" | "grace-period" | "error";

/**
 * Structured attribution information parsed from response headers.
 *
 * - `status`        — Current attribution verification state.
 * - `graceDeadline` — If in grace period, the deadline by which attribution must be verified.
 * - `verifiedAt`    — Timestamp of when attribution was last verified.
 * - `isValid`       — Derived boolean: true when status is "verified", "pending",
 *                      or "grace-period" with a future graceDeadline.
 */
export interface AttributionInfo {
  status: AttributionStatus;
  graceDeadline?: Date;
  verifiedAt?: Date;
  isValid: boolean;
}

// ---------------------------------------------------------------------------
// Error Code Discriminated Union
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all machine-readable error codes used by the SDK.
 *
 * Each code maps to a specific error class or error condition:
 * - `DOMAIN_VALIDATION_ERROR` — {@link DomainValidationError}
 * - `RATE_LIMIT_ERROR`        — {@link RateLimitError}
 * - `QUOTA_EXCEEDED_ERROR`    — {@link QuotaExceededError}
 * - `AUTHENTICATION_ERROR`    — {@link AuthenticationError}
 * - `FORBIDDEN_ERROR`         — {@link ForbiddenError}
 * - `NOT_FOUND_ERROR`         — {@link NotFoundError}
 * - `SCRAPE_TIMEOUT_ERROR`    — {@link ScrapeTimeoutError}
 * - `ABORT_ERROR`             — Abort signal triggered
 * - `NETWORK_ERROR`           — Network failure
 * - `SERVER_ERROR`            — HTTP 5xx response
 * - `UNEXPECTED_ERROR`        — Unhandled HTTP status
 * - `SCRAPE_FAILED`           — Scrape job failed
 * - `SCRAPE_PARSE_ERROR`      — Scrape response parsing failure
 * - `BAD_REQUEST_ERROR`       — {@link BadRequestError}
 */
export type LogoErrorCode =
  | "DOMAIN_VALIDATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "QUOTA_EXCEEDED_ERROR"
  | "AUTHENTICATION_ERROR"
  | "FORBIDDEN_ERROR"
  | "NOT_FOUND_ERROR"
  | "SCRAPE_TIMEOUT_ERROR"
  | "ABORT_ERROR"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNEXPECTED_ERROR"
  | "SCRAPE_FAILED"
  | "SCRAPE_PARSE_ERROR"
  | "BAD_REQUEST_ERROR";
