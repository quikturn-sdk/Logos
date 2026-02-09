/**
 * @quikturn/logos SDK — URL Builder
 *
 * Pure function that constructs a fully-qualified Logos API URL from a domain
 * string and optional request parameters. No network calls are made.
 *
 * The URL builder performs strict domain validation (RFC 1035/1123), resolves
 * size/format options, and appends only non-default query parameters to keep
 * generated URLs concise.
 */

import type { LogoRequestOptions, SupportedOutputFormat, FormatShorthand } from "./types";
import {
  BASE_URL,
  DEFAULT_WIDTH,
  MAX_WIDTH,
  MAX_WIDTH_SERVER,
  FORMAT_ALIASES,
  SUPPORTED_FORMATS,
} from "./constants";
import { DomainValidationError } from "./errors";

// ---------------------------------------------------------------------------
// Domain Validation
// ---------------------------------------------------------------------------

/** Matches IPv4 addresses (e.g. "192.168.1.1"). */
const IP_ADDRESS_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

/**
 * Validates a single DNS label per RFC 1035/1123.
 * - Only lowercase alphanumeric and hyphens
 * - Cannot start or end with a hyphen
 * - 1 to 63 characters
 */
const LABEL_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/**
 * Validates a domain string according to RFC 1035/1123 rules.
 *
 * Rejects:
 * - Empty strings
 * - Strings containing a protocol scheme (://)
 * - Strings containing a path separator (/)
 * - IPv4 addresses (e.g. "192.168.1.1")
 * - "localhost"
 * - Total length exceeding 253 characters
 * - Any label exceeding 63 characters
 * - Labels with invalid characters or starting/ending with hyphens
 * - Single-label domains (must have at least one dot)
 *
 * @param domain - The raw domain string to validate.
 * @returns The normalized (trimmed, lowercased, trailing-dot-stripped) domain.
 * @throws {DomainValidationError} If validation fails.
 */
function validateDomain(domain: string): string {
  // Normalize: trim whitespace and lowercase
  const normalized = domain.trim().toLowerCase();

  // Strip trailing dot (FQDN notation)
  const clean = normalized.endsWith(".") ? normalized.slice(0, -1) : normalized;

  // Reject empty
  if (clean.length === 0) {
    throw new DomainValidationError("Domain must not be empty", domain);
  }

  // Reject protocol schemes
  if (clean.includes("://")) {
    throw new DomainValidationError(
      "Domain must not include a protocol scheme (e.g. remove \"https://\")",
      domain,
    );
  }

  // Reject paths
  if (clean.includes("/")) {
    throw new DomainValidationError(
      "Domain must not include a path — provide only the hostname",
      domain,
    );
  }

  // Reject IP addresses
  if (IP_ADDRESS_RE.test(clean)) {
    throw new DomainValidationError(
      "IP addresses are not supported — provide a domain name",
      domain,
    );
  }

  // Reject localhost
  if (clean === "localhost") {
    throw new DomainValidationError(
      "\"localhost\" is not a valid domain",
      domain,
    );
  }

  // RFC 1035: total length must not exceed 253 characters
  if (clean.length > 253) {
    throw new DomainValidationError(
      `Domain exceeds maximum length of 253 characters (got ${clean.length})`,
      domain,
    );
  }

  // Split into labels and validate each one
  const labels = clean.split(".");

  // Must have at least two labels (e.g. "example.com")
  if (labels.length < 2) {
    throw new DomainValidationError(
      "Domain must contain at least two labels (e.g. \"example.com\")",
      domain,
    );
  }

  for (const label of labels) {
    // RFC 1035: each label must be 1-63 characters
    if (label.length === 0) {
      throw new DomainValidationError(
        "Domain contains an empty label (consecutive dots)",
        domain,
      );
    }

    if (label.length > 63) {
      throw new DomainValidationError(
        `Label "${label}" exceeds maximum length of 63 characters (got ${label.length})`,
        domain,
      );
    }

    // RFC 1035/1123: alphanumeric and hyphens only, no leading/trailing hyphens
    if (!LABEL_RE.test(label)) {
      throw new DomainValidationError(
        `Label "${label}" contains invalid characters — only letters, digits, and hyphens are allowed, and labels must not start or end with a hyphen`,
        domain,
      );
    }
  }

  return clean;
}

// ---------------------------------------------------------------------------
// Format Resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a user-supplied format option to a valid shorthand string.
 *
 * Accepts full MIME types (e.g. "image/png") and shorthand aliases (e.g. "png").
 * Returns the shorthand form suitable for the `format` query parameter,
 * or `undefined` if the input is not a recognized format.
 */
function resolveFormat(
  format: SupportedOutputFormat | FormatShorthand | string,
): FormatShorthand | undefined {
  let candidate = format;

  // Strip "image/" prefix if present
  if (candidate.startsWith("image/")) {
    candidate = candidate.slice(6); // "image/".length === 6
  }

  // Check if it is a known shorthand
  if (candidate in FORMAT_ALIASES) {
    return candidate as FormatShorthand;
  }

  // Check if the full MIME string is a supported format (fallback)
  if (SUPPORTED_FORMATS.has(format as SupportedOutputFormat)) {
    // Extract shorthand from the MIME type
    const shorthand = (format as string).slice(6);
    if (shorthand in FORMAT_ALIASES) {
      return shorthand as FormatShorthand;
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// URL Builder
// ---------------------------------------------------------------------------

/**
 * Constructs a fully-qualified Logos API URL for the given domain.
 *
 * This is a pure function with no side effects. It validates the domain,
 * resolves size and format options, and builds a URL with only the
 * non-default query parameters appended.
 *
 * @param domain  - The domain to fetch a logo for (e.g. "github.com").
 * @param options - Optional request parameters (token, size, format, etc.).
 * @returns A fully-qualified URL string.
 *
 * @throws {DomainValidationError} If the domain fails RFC 1035/1123 validation.
 *
 * @example
 * ```ts
 * logoUrl("github.com");
 * // => "https://logos.getquikturn.io/github.com"
 *
 * logoUrl("github.com", { size: 256, greyscale: true, token: "qt_abc123" });
 * // => "https://logos.getquikturn.io/github.com?token=qt_abc123&size=256&greyscale=1"
 * ```
 */
export function logoUrl(domain: string, options?: LogoRequestOptions): string {
  // 1. Validate and normalize the domain
  const validDomain = validateDomain(domain);

  // 2. Destructure options with defaults
  const {
    token,
    size,
    width,
    greyscale,
    theme,
    format,
    baseUrl,
  } = options ?? {};

  // 3. Determine max width based on key type
  //    sk_ prefix = server key = MAX_WIDTH_SERVER (1200)
  //    anything else = publishable key = MAX_WIDTH (800)
  const maxWidth = token?.startsWith("sk_") ? MAX_WIDTH_SERVER : MAX_WIDTH;

  // 4. Resolve size: `size` takes precedence over `width`
  let resolvedSize = size ?? width ?? DEFAULT_WIDTH;
  if (resolvedSize <= 0) {
    resolvedSize = DEFAULT_WIDTH;
  }
  // Clamp to 1..maxWidth
  resolvedSize = Math.max(1, Math.min(resolvedSize, maxWidth));

  // 5. Resolve format
  const resolvedFormat = format ? resolveFormat(format) : undefined;

  // 6. Build URL
  const effectiveBaseUrl = baseUrl ?? BASE_URL;
  const url = new URL(`${effectiveBaseUrl}/${validDomain}`);

  // Append only non-default query parameters

  if (token !== undefined) {
    url.searchParams.set("token", token);
  }

  if (resolvedSize !== DEFAULT_WIDTH) {
    url.searchParams.set("size", String(resolvedSize));
  }

  if (greyscale === true) {
    url.searchParams.set("greyscale", "1");
  }

  if (theme === "light" || theme === "dark") {
    url.searchParams.set("theme", theme);
  }

  if (resolvedFormat !== undefined) {
    url.searchParams.set("format", resolvedFormat);
  }

  url.searchParams.set("autoScrape", "true");

  return url.toString();
}
