import type { Tier, KeyType, SupportedOutputFormat, FormatShorthand } from "./types";

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

/** Root endpoint for the Quikturn Logos API. */
export const BASE_URL = "https://logos.getquikturn.io" as const;

// ---------------------------------------------------------------------------
// Size Defaults & Limits
// ---------------------------------------------------------------------------

/** Default logo width in pixels when no size/width is provided. */
export const DEFAULT_WIDTH = 128 as const;

/** Maximum width (px) for requests using publishable keys (qt_/pk_). */
export const MAX_WIDTH = 800 as const;

/** Maximum width (px) for requests using secret keys (sk_). */
export const MAX_WIDTH_SERVER = 1200 as const;

// ---------------------------------------------------------------------------
// Output Format Defaults
// ---------------------------------------------------------------------------

/** Default MIME type returned when no format is specified. */
export const DEFAULT_FORMAT: SupportedOutputFormat = "image/png";

/** All MIME types the Logos API can produce. */
export const SUPPORTED_FORMATS: ReadonlySet<SupportedOutputFormat> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);

/** Maps shorthand format strings to their full MIME types. */
export const FORMAT_ALIASES: Readonly<
  Record<FormatShorthand, SupportedOutputFormat>
> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
} as const;

// ---------------------------------------------------------------------------
// Rate Limits (per-minute, informational -- enforced by the worker, not SDK)
// ---------------------------------------------------------------------------

/**
 * Per-tier rate limits for publishable-key (browser) requests.
 * All tiers share a 60-second sliding window.
 */
export const RATE_LIMITS: Readonly<
  Record<Tier, { requests: number; windowSeconds: number }>
> = {
  free: { requests: 100, windowSeconds: 60 },
  launch: { requests: 500, windowSeconds: 60 },
  growth: { requests: 5_000, windowSeconds: 60 },
  enterprise: { requests: 50_000, windowSeconds: 60 },
} as const;

/**
 * Per-tier rate limits for secret-key (server) requests.
 * The free tier does not have server-side access.
 */
export const SERVER_RATE_LIMITS: Readonly<
  Record<
    Exclude<Tier, "free">,
    { requests: number; windowSeconds: number }
  >
> = {
  launch: { requests: 1_000, windowSeconds: 60 },
  growth: { requests: 10_000, windowSeconds: 60 },
  enterprise: { requests: 100_000, windowSeconds: 60 },
} as const;

// ---------------------------------------------------------------------------
// Runtime Enum Arrays
// ---------------------------------------------------------------------------

/** All subscription tiers as a runtime-iterable tuple. */
export const TIERS: readonly Tier[] = ["free", "launch", "growth", "enterprise"] as const;

/** All key types as a runtime-iterable tuple. */
export const KEY_TYPES: readonly KeyType[] = ["publishable", "secret"] as const;

// ---------------------------------------------------------------------------
// Monthly Quotas
// ---------------------------------------------------------------------------

/** Maximum logo requests per calendar month for each tier. */
export const MONTHLY_LIMITS: Readonly<Record<Tier, number>> = {
  free: 500_000,
  launch: 1_000_000,
  growth: 5_000_000,
  enterprise: 10_000_000,
} as const;
