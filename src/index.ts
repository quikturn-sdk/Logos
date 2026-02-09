// Universal entry point — @quikturn/logos
// Re-exports types, constants, and URL builder

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
