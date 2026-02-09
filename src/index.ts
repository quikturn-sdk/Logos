/**
 * @module @quikturn/logos
 *
 * Universal entry point for the Quikturn Logos SDK.
 *
 * This module provides the URL builder, types, constants, error classes,
 * and header parser — everything needed without making network calls.
 *
 * For browser-side fetch capabilities, use `@quikturn/logos/client`.
 * For server-side fetch capabilities, use `@quikturn/logos/server`.
 *
 * @example
 * ```ts
 * import { logoUrl, BASE_URL } from "@quikturn/logos";
 *
 * const url = logoUrl("github.com", { size: 256 });
 * ```
 *
 * @packageDocumentation
 */

// --- Types (compile-time only) ---
export type {
  KeyType,
  KeyPrefix,
  Tier,
  TokenStatus,
  ThemeOption,
  SupportedOutputFormat,
  FormatShorthand,
  LogoRequestOptions,
  LogoMetadata,
  BrowserLogoResponse,
  ServerLogoResponse,
  ScrapeJob,
  ScrapePendingResponse,
  ScrapeJobStatus,
  ScrapeProgressEvent,
  AttributionStatus,
  AttributionInfo,
  LogoErrorCode,
} from "./types";

// --- Constants (runtime) ---
export {
  BASE_URL,
  DEFAULT_WIDTH,
  MAX_WIDTH,
  MAX_WIDTH_SERVER,
  DEFAULT_FORMAT,
  SUPPORTED_FORMATS,
  FORMAT_ALIASES,
  RATE_LIMITS,
  SERVER_RATE_LIMITS,
  MONTHLY_LIMITS,
  TIERS,
  KEY_TYPES,
} from "./constants";

// --- URL Builder (runtime) ---
export { logoUrl } from "./url-builder";

// --- Header Parser (runtime) ---
export { parseLogoHeaders, parseRetryAfter } from "./headers";

// --- Error Classes (runtime) ---
export {
  LogoError,
  DomainValidationError,
  RateLimitError,
  QuotaExceededError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ScrapeTimeoutError,
  BadRequestError,
} from "./errors";
