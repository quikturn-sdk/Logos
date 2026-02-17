/**
 * @module @quikturn/logos
 *
 * Universal entry point for the Quikturn Logos SDK.
 *
 * This module provides the URL builder, types, constants, and error classes
 * — everything needed without making network calls.
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
  ThemeOption,
  LogoVariant,
  SupportedOutputFormat,
  FormatShorthand,
  LogoRequestOptions,
  LogoMetadata,
  BrowserLogoResponse,
  ServerLogoResponse,
  ScrapeProgressEvent,
  LogoErrorCode,
} from "./types";

// --- Constants (runtime) ---
export {
  BASE_URL,
  DEFAULT_WIDTH,
  DEFAULT_FORMAT,
  SUPPORTED_FORMATS,
  FORMAT_ALIASES,
} from "./constants";

// --- URL Builder (runtime) ---
export { logoUrl } from "./url-builder";

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
