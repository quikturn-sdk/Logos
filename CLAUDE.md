# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package

`@quikturn/logos` — TypeScript SDK for the Quikturn Logos API (fetch company logos by domain). Zero runtime dependencies. Published as ESM + CJS with `.mjs`/`.cjs` extensions.

## Commands

```bash
pnpm install              # Install dependencies (always use pnpm, never npm)
pnpm build                # Build via tsup (outputs to dist/)
pnpm test                 # Run unit + client + server + element tests
pnpm test -- --project unit          # Run only unit tests (node env)
pnpm test -- --project client        # Run only client tests (jsdom env)
pnpm test -- --project server        # Run only server tests (node env)
pnpm test -- --project element       # Run only element tests (jsdom env)
pnpm test:integration     # Run integration tests (requires QUIKTURN_* env vars)
pnpm test:watch           # Watch mode (all projects)
pnpm test:coverage        # Run with v8 coverage
pnpm typecheck            # tsc --noEmit
vitest run tests/url-builder.test.ts  # Run a single test file
```

## Architecture

Four entry points, each with a separate tsup bundle and package.json `exports` condition:

```
@quikturn/logos           → src/index.ts        (universal barrel: types, constants, url-builder, errors)
@quikturn/logos/client    → src/client/index.ts  (QuikturnLogos browser class, jsdom test env)
@quikturn/logos/server    → src/server/index.ts  (QuikturnLogos server class, node test env)
@quikturn/logos/element   → src/element/index.ts (<quikturn-logo> web component, jsdom test env)
```

### Source layout

- `src/types.ts` — All public type definitions (compile-time only, no runtime code)
- `src/constants.ts` — `BASE_URL`, rate limits, quotas, format maps, safety caps
- `src/url-builder.ts` — `logoUrl()` pure function with RFC 1035/1123 domain validation
- `src/errors.ts` — `LogoError` base class + 7 subclasses, `LogoErrorCode` discriminated union (14 codes)
- `src/headers.ts` — `parseLogoHeaders()` and `parseRetryAfter()` for response header parsing
- `src/internal/delay.ts` — Abort-aware `delay(ms, signal?)` shared by fetcher + poller
- `src/internal/beacon.ts` — Fire-and-forget attribution pixel, SSR-safe, deduped by token
- `src/client/fetcher.ts` — `browserFetch()` with retry, error mapping, warning callbacks (no Authorization header)
- `src/client/scrape-poller.ts` — `handleScrapeResponse()` for 202 scrape polling with exponential backoff
- `src/client/attribution.ts` — `parseAttributionStatus()` for free-tier attribution headers
- `src/server/fetcher.ts` — `serverFetch()` like browser fetcher but sends `Authorization: Bearer` header
- `src/server/batch.ts` — `getMany()` async generator with concurrency pool, order preservation, rate-limit backoff
- `src/element/index.ts` — `QuikturnLogo` custom element, shadow DOM, auto-registers
- `src/element/styles.ts` — Shadow DOM CSS with `!important` attribution protection

### Key auth pattern

- **Browser client**: publishable key (`qt_`/`pk_` prefix) passed as `?token=` query param
- **Server client**: secret key (`sk_` prefix) sent as `Authorization: Bearer` header, never in URL
- Browser client rejects `sk_` keys; server client rejects non-`sk_` keys

### Test environment mapping (vitest.config.ts)

Uses Vitest `projects` field (not deprecated `environmentMatchGlobs`):
- `tests/*.test.ts` → node (unit)
- `tests/client/**` → jsdom (client)
- `tests/server/**` → node (server)
- `tests/element/**` → jsdom (element)
- `tests/integration/**` → node (integration, skipped without env vars)

### Build (tsup.config.ts)

Four tsup configs produce ESM+CJS bundles with forced `.mjs`/`.cjs` extensions via `outExtension`. The `types` condition is listed first in package.json exports. Element entry is in `sideEffects` array.

## Conventions

- Branding: always "Quikturn" (lowercase t), never "QuikTurn"
- Coverage thresholds: 90% branches, 95% lines/functions/statements
- `src/index.ts` is excluded from coverage (pure barrel re-export)
- TypeScript strict mode with `noUncheckedIndexedAccess`
- Element build tests use string content checks (can't `import()` element in Node — no HTMLElement)
