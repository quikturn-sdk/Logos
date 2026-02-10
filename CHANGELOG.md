# Changelog

All notable changes to the `@quikturn/logos` SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-10

### Added

- **Attribution beacon** (`src/internal/beacon.ts`)
  - Fire-and-forget 1x1 pixel via `new Image().src` to `/_beacon` endpoint
  - Deduplicates by token per page load; skips `sk_` server keys and empty tokens
  - SSR-safe: no-ops when `window` is not defined
  - Integrated into browser client `get()` -- fires automatically after successful fetch

- **`<quikturn-logo>` web component** (`@quikturn/logos/element`)
  - Shadow DOM element with auto-registration as `quikturn-logo`
  - Observed attributes: `domain`, `token`, `size`, `format`, `greyscale`, `theme`
  - Built-in "Powered by Quikturn" attribution link with `!important` CSS in shadow DOM
  - Fires attribution beacon on `connectedCallback`
  - Safe `customElements.define` guard against double-registration
  - No framework dependency -- works in plain HTML

- **React components** (`@quikturn/logos-react` v0.1.0)
  - `QuikturnProvider` -- context provider for token and base URL propagation
  - `QuikturnLogo` -- single logo image with lazy loading, optional link wrapper
  - `QuikturnLogoCarousel` -- infinite scrolling logo ticker (rAF-driven, horizontal/vertical, pause on hover, fade overlays, scale on hover)
  - `QuikturnLogoGrid` -- responsive CSS grid layout for logos
  - `useLogoUrl()` -- hook returning a memoized Quikturn logo URL
  - Zero CSS dependencies (inline styles only)
  - 54 tests across 5 test files

### Changed

- `tsconfig.json` -- added `"lib": ["ES2020", "DOM", "DOM.Iterable"]` for DOM type support
- `package.json` -- `sideEffects` changed from `false` to array marking element entry points
- Added `./element` to exports map
- Monorepo structure: `pnpm-workspace.yaml` with `packages/*` workspace

---

## [0.1.0] - 2026-02-09

### Added

- **Universal entry point** (`@quikturn/logos`)
  - `logoUrl()` -- pure URL builder with RFC 1035/1123 domain validation, size clamping (128-800px browser, up to 1200px server), and format resolution with shorthand aliases
  - 18 public TypeScript types and interfaces (`LogoRequestOptions`, `LogoMetadata`, `BrowserLogoResponse`, `ServerLogoResponse`, `ScrapeJob`, `AttributionInfo`, etc.)
  - `LogoErrorCode` discriminated union type (14 codes) for type-safe error handling
  - Runtime constants: `BASE_URL`, `DEFAULT_WIDTH`, `MAX_WIDTH`, `MAX_WIDTH_SERVER`, `RATE_LIMITS`, `SERVER_RATE_LIMITS`, `MONTHLY_LIMITS`, `TIERS`, `KEY_TYPES`, `SUPPORTED_FORMATS`, `FORMAT_ALIASES`
  - Response header parsers: `parseLogoHeaders()` and `parseRetryAfter()` for structured `LogoMetadata` extraction
  - 9 error classes with typed `code` property: `LogoError`, `DomainValidationError`, `RateLimitError`, `QuotaExceededError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ScrapeTimeoutError`, `BadRequestError`
  - Abort-aware `delay(ms, signal?)` internal utility shared across fetcher and scrape-poller

- **Browser client** (`@quikturn/logos/client`)
  - `QuikturnLogos` class with `get()`, `getUrl()`, `on()`/`off()`, and `destroy()` methods
  - Publishable key authentication (`qt_`/`pk_` prefix, token passed as URL query parameter)
  - `browserFetch()` with automatic retry and exponential backoff for 429 and 5xx responses
  - Auto-scrape polling via `handleScrapeResponse()` with configurable timeout and progress callbacks
  - Free-tier attribution helper: `parseAttributionStatus()` for compliance tracking
  - Blob URL lifecycle management with automatic cleanup on `destroy()`
  - Rate limit and quota warning events emitted via `on()`/`off()` event system

- **Server client** (`@quikturn/logos/server`)
  - `QuikturnLogos` class with `get()`, `getMany()`, `getStream()`, `getUrl()`, `on()`/`off()` methods
  - Secret key authentication (`sk_` prefix, `Authorization: Bearer` header)
  - `serverFetch()` with automatic retry and exponential backoff for 429 and 5xx responses
  - `getMany()` batch operations with concurrency control, order preservation, and partial failure handling
  - `getStream()` for zero-copy response streaming via `ReadableStream`
  - Rate limit and quota warning events emitted via event system

- **Build and packaging**
  - Triple entry-point build: ESM (`.mjs`) + CJS (`.cjs`) + TypeScript declarations (`.d.ts`) for each entry point
  - Tree-shakeable output (`sideEffects: false`)
  - Platform-specific builds: browser platform for client, Node.js 22 target for server
  - `types` condition listed first in exports map for correct TypeScript resolution
  - `prepublishOnly` script runs typecheck, tests, and build in sequence

- **Testing**
  - 229 unit tests across 12 test files (unit, client, server projects)
  - 12 integration tests (auto-skip when API keys are not available)
  - Coverage thresholds enforced: 90% branches, 95% lines/functions/statements
  - Build verification tests: import resolution, bundle size checks, tree-shaking validation

[0.2.0]: https://github.com/quikturn/logos-sdk/releases/tag/v0.2.0
[0.1.0]: https://github.com/quikturn/logos-sdk/releases/tag/v0.1.0
