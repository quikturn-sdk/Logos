# @quikturn/logos

> TypeScript SDK for the Quikturn Logos API -- fetch company logos with type safety.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@quikturn/logos`](https://www.npmjs.com/package/@quikturn/logos) | Core SDK -- URL builder, browser client, server client, web component | `pnpm add @quikturn/logos` |
| [`@quikturn/logos-react`](https://www.npmjs.com/package/@quikturn/logos-react) | React components -- `<QuikturnLogo>`, `<QuikturnLogoCarousel>`, `<QuikturnLogoGrid>` | `pnpm add @quikturn/logos-react` |

## Features

- **Zero-dependency URL builder** -- universal, works in any JavaScript runtime
- **Browser client** -- blob URL management, retry/backoff, scrape polling, event emission
- **Server client** -- Buffer output, ReadableStream streaming, concurrent batch operations
- **`<quikturn-logo>` web component** -- zero-effort attribution element with shadow DOM
- **React components** -- see [`@quikturn/logos-react`](./packages/react/) for `<QuikturnLogo>`, `<QuikturnLogoCarousel>`, and `<QuikturnLogoGrid>`
- **Full TypeScript support** -- strict types, discriminated union error codes, generic response shapes
- **Tree-shakeable** -- ESM and CJS dual builds; import only what you need

## Installation

```bash
# pnpm (recommended)
pnpm add @quikturn/logos

# npm
npm install @quikturn/logos

# yarn
yarn add @quikturn/logos
```

**Requirements:** Node.js >= 18

## Quick Start

### URL Builder (Universal)

The URL builder runs everywhere -- browsers, Node.js, edge runtimes -- with zero dependencies and no network calls.

```ts
import { logoUrl } from "@quikturn/logos";

// Simple usage
const url = logoUrl("github.com");
// => "https://logos.getquikturn.io/github.com"

// With options
const customUrl = logoUrl("stripe.com", {
  token: "qt_abc123",
  size: 256,
  format: "webp",
  greyscale: true,
  theme: "dark",
});
// => "https://logos.getquikturn.io/stripe.com?token=qt_abc123&size=256&greyscale=1&theme=dark&format=webp"
```

### Browser Client

```ts
import { QuikturnLogos } from "@quikturn/logos/client";

const client = new QuikturnLogos({ token: "qt_your_publishable_key" });

// Fetch a logo as a blob URL (ready for <img src>)
const { url, blob, contentType, metadata } = await client.get("github.com", {
  size: 256,
  format: "webp",
});

document.querySelector("img")!.src = url;

// Listen for rate limit warnings
client.on("rateLimitWarning", (remaining, limit) => {
  console.warn(`Rate limit: ${remaining}/${limit} requests remaining`);
});

// Clean up blob URLs when done
client.destroy();
```

### Server Client

```ts
import { QuikturnLogos } from "@quikturn/logos/server";

const client = new QuikturnLogos({ secretKey: "sk_your_secret_key" });

// Fetch a logo as a Buffer
const { buffer, contentType, metadata } = await client.get("github.com", {
  size: 512,
  format: "png",
});

// Batch fetch multiple logos
for await (const result of client.getMany(["github.com", "stripe.com", "vercel.com"])) {
  if (result.success) {
    console.log(`${result.domain}: ${result.buffer!.byteLength} bytes`);
  } else {
    console.error(`${result.domain}: ${result.error!.message}`);
  }
}

// Stream a logo to a file
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";

const stream = await client.getStream("github.com", { format: "png" });
Readable.fromWeb(stream).pipe(createWriteStream("logo.png"));
```

### Web Component

The `<quikturn-logo>` custom element renders a logo with built-in attribution. It uses shadow DOM to protect the attribution badge and requires no framework.

```html
<script type="module">
  import "@quikturn/logos/element";
</script>

<quikturn-logo
  domain="github.com"
  token="qt_abc123"
  size="64"
  format="webp"
  theme="dark"
></quikturn-logo>
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `domain` | `string` | Domain to fetch logo for (required for rendering) |
| `token` | `string` | Publishable API key |
| `size` | `string` | Image width in pixels |
| `format` | `string` | `"png"`, `"jpeg"`, `"webp"`, or `"avif"` |
| `greyscale` | presence | When present, applies greyscale transformation |
| `theme` | `string` | `"light"` or `"dark"` |

The element automatically registers as `quikturn-logo` on import and fires an attribution beacon on first render. Attribution styling uses `!important` rules inside the shadow DOM to prevent accidental removal.

### React Components

For React applications, install the companion package:

```bash
pnpm add @quikturn/logos-react
```

```tsx
import { QuikturnProvider, QuikturnLogo, QuikturnLogoCarousel } from "@quikturn/logos-react";

<QuikturnProvider token="qt_your_key">
  <QuikturnLogo domain="github.com" size={64} />
  <QuikturnLogoCarousel
    domains={["github.com", "stripe.com", "vercel.com"]}
    speed={120}
    fadeOut
    pauseOnHover
  />
</QuikturnProvider>
```

See the full API reference in [`@quikturn/logos-react` README](./packages/react/README.md).

## API Reference

### Universal (`@quikturn/logos`)

The universal entry point exports the URL builder, types, constants, and error classes. No network calls are made from this module.

#### `logoUrl(domain, options?)`

Constructs a fully-qualified Logos API URL. Pure function with no side effects.

| Parameter | Type | Description |
|-----------|------|-------------|
| `domain` | `string` | Domain to fetch a logo for (e.g. `"github.com"`) |
| `options` | `LogoRequestOptions` | Optional request parameters |

**Returns:** `string` -- fully-qualified URL

**Throws:** `DomainValidationError` if the domain fails RFC 1035/1123 validation

##### `LogoRequestOptions`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `token` | `string` | -- | Publishable key (`qt_`/`pk_`) appended as a query parameter |
| `size` | `number` | `128` | Output width in pixels |
| `width` | `number` | `128` | Alias for `size` |
| `greyscale` | `boolean` | `false` | When `true`, applies saturation: 0 transformation |
| `theme` | `"light" \| "dark"` | -- | Optimize logo for light or dark backgrounds |
| `format` | `SupportedOutputFormat \| FormatShorthand` | `"image/png"` | Output image format |
| `baseUrl` | `string` | `"https://logos.getquikturn.io"` | Override the API base URL |

#### Types

```ts
import type {
  // Request
  ThemeOption,           // "light" | "dark"
  SupportedOutputFormat, // "image/png" | "image/jpeg" | "image/webp" | "image/avif"
  FormatShorthand,       // "png" | "jpeg" | "webp" | "avif"
  LogoRequestOptions,

  // Response
  LogoMetadata,
  BrowserLogoResponse,
  ServerLogoResponse,

  // Scrape polling
  ScrapeProgressEvent,

  // Error codes
  LogoErrorCode,
} from "@quikturn/logos";
```

#### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `BASE_URL` | `"https://logos.getquikturn.io"` | Root API endpoint |
| `DEFAULT_WIDTH` | `128` | Default logo width (px) |
| `DEFAULT_FORMAT` | `"image/png"` | Default output MIME type |
| `SUPPORTED_FORMATS` | `Set<SupportedOutputFormat>` | All supported MIME types |
| `FORMAT_ALIASES` | `Record<FormatShorthand, SupportedOutputFormat>` | Shorthand-to-MIME mapping |

---

### Browser Client (`@quikturn/logos/client`)

#### `new QuikturnLogos(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | `string` | **required** | Publishable key (`qt_`/`pk_` prefix). Server keys (`sk_`) are rejected. |
| `baseUrl` | `string` | `"https://logos.getquikturn.io"` | Override the API base URL |
| `maxRetries` | `number` | `2` | Max retry attempts for rate-limited/server-error responses |

#### `client.get(domain, options?)`

Fetches a logo and returns a `BrowserLogoResponse`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | `128` | Output width in pixels |
| `width` | `number` | `128` | Alias for `size` |
| `greyscale` | `boolean` | `false` | Greyscale transformation |
| `theme` | `"light" \| "dark"` | -- | Gamma curve adjustment |
| `format` | `SupportedOutputFormat \| FormatShorthand` | `"image/png"` | Output format |
| `scrapeTimeout` | `number` | -- | Max time (ms) to wait for scrape completion |
| `onScrapeProgress` | `(event: ScrapeProgressEvent) => void` | -- | Callback for scrape progress |
| `signal` | `AbortSignal` | -- | Cancel the request |

**Returns:** `Promise<BrowserLogoResponse>`

```ts
interface BrowserLogoResponse {
  url: string;          // blob: object URL for <img src>
  blob: Blob;           // Raw image Blob
  contentType: string;  // e.g. "image/webp"
  metadata: LogoMetadata;
}
```

#### `client.getUrl(domain, options?)`

Returns a plain URL string without making a network request. Useful for `<img>` tags, CSS `background-image`, or preloading hints.

**Returns:** `string`

#### `client.on(event, handler)` / `client.off(event, handler)`

Register or remove event listeners.

| Event | Handler Signature | Description |
|-------|-------------------|-------------|
| `"rateLimitWarning"` | `(remaining: number, limit: number) => void` | Fires when rate limit is approaching |
| `"quotaWarning"` | `(remaining: number, limit: number) => void` | Fires when monthly quota is approaching |

#### `client.destroy()`

Revokes all tracked `blob:` object URLs to free memory and removes all event listeners. Call this when the client is no longer needed to prevent memory leaks in long-lived browser sessions.

---

### Server Client (`@quikturn/logos/server`)

#### `new QuikturnLogos(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `secretKey` | `string` | **required** | Secret key (`sk_` prefix). Publishable keys (`qt_`/`pk_`) are rejected. |
| `baseUrl` | `string` | `"https://logos.getquikturn.io"` | Override the API base URL |
| `maxRetries` | `number` | `2` | Max retry attempts for rate-limited/server-error responses |

#### `client.get(domain, options?)`

Fetches a logo and returns a `ServerLogoResponse`.

Accepts the same options as the browser client's `get()` method.

**Returns:** `Promise<ServerLogoResponse>`

```ts
interface ServerLogoResponse {
  buffer: Buffer;       // Raw image bytes
  contentType: string;  // e.g. "image/png"
  metadata: LogoMetadata;
}
```

#### `client.getMany(domains, options?)`

Fetches logos for multiple domains with concurrency control. Yields results in the same order as the input array.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrency` | `number` | `5` | Maximum parallel fetches |
| `size` | `number` | `128` | Output width in pixels |
| `greyscale` | `boolean` | `false` | Greyscale transformation |
| `theme` | `"light" \| "dark"` | -- | Gamma curve adjustment |
| `format` | `SupportedOutputFormat \| FormatShorthand` | `"image/png"` | Output format |
| `signal` | `AbortSignal` | -- | Cancel remaining batch items |
| `continueOnError` | `boolean` | `true` | Capture errors per-domain instead of aborting the batch |

**Returns:** `AsyncGenerator<BatchResult>`

```ts
interface BatchResult {
  domain: string;
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  metadata?: LogoMetadata;
  error?: LogoError;
}
```

#### `client.getStream(domain, options?)`

Returns the raw response body as a `ReadableStream`. Useful for piping to a file or HTTP response without buffering the entire image in memory.

Accepts the same options as `get()`.

**Returns:** `Promise<ReadableStream>`

#### `client.getUrl(domain, options?)`

Returns a plain URL string without making a network request. Does **not** include the secret key -- use the `Authorization: Bearer` header when fetching.

**Returns:** `string`

#### `client.on(event, handler)` / `client.off(event, handler)`

Same event interface as the browser client. Supports `"rateLimitWarning"` and `"quotaWarning"` events.

---

### Error Classes

All SDK errors extend `LogoError`, which extends the native `Error` class with a machine-readable `code` and an optional HTTP `status`.

```ts
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
} from "@quikturn/logos";
```

| Error Class | Code | HTTP Status | Extra Properties |
|-------------|------|-------------|------------------|
| `LogoError` | varies | varies | `code: LogoErrorCode`, `status?: number` |
| `DomainValidationError` | `DOMAIN_VALIDATION_ERROR` | -- | `domain: string` |
| `AuthenticationError` | `AUTHENTICATION_ERROR` | 401 | -- |
| `ForbiddenError` | `FORBIDDEN_ERROR` | 403 | `reason: string` |
| `NotFoundError` | `NOT_FOUND_ERROR` | 404 | `domain: string` |
| `BadRequestError` | `BAD_REQUEST_ERROR` | 400 | -- |
| `RateLimitError` | `RATE_LIMIT_ERROR` | 429 | `retryAfter: number`, `remaining: number`, `resetAt: Date` |
| `QuotaExceededError` | `QUOTA_EXCEEDED_ERROR` | 429 | `retryAfter: number`, `limit: number`, `used: number` |
| `ScrapeTimeoutError` | `SCRAPE_TIMEOUT_ERROR` | -- | `jobId: string`, `elapsed: number` |

All error codes are typed via the `LogoErrorCode` discriminated union for exhaustive switch handling:

```ts
import { LogoError } from "@quikturn/logos";
import type { LogoErrorCode } from "@quikturn/logos";

try {
  const { url } = await client.get("example.com");
} catch (err) {
  if (err instanceof LogoError) {
    switch (err.code) {
      case "RATE_LIMIT_ERROR":
        // err is narrowed, handle backoff
        break;
      case "NOT_FOUND_ERROR":
        // show placeholder
        break;
      // ... handle other cases
    }
  }
}
```

## Authentication

The Quikturn Logos API uses token-based authentication with two key types:

| Key Type | Prefix | Environment | Auth Method |
|----------|--------|-------------|-------------|
| **Publishable** | `qt_` or `pk_` | Browser | Query parameter (`?token=...`) |
| **Secret** | `sk_` | Server only | `Authorization: Bearer` header |

- **Publishable keys** are safe to expose in client-side code. They are passed as query parameters and support a max image width of 800px.
- **Secret keys** must never be exposed to the browser. They are sent via the `Authorization` header and support a max image width of 1200px.

```ts
// Browser -- publishable key
import { QuikturnLogos } from "@quikturn/logos/client";
const client = new QuikturnLogos({ token: "qt_your_publishable_key" });

// Server -- secret key
import { QuikturnLogos } from "@quikturn/logos/server";
const client = new QuikturnLogos({ secretKey: "sk_your_secret_key" });
```

## Configuration

### Custom Base URL

Override the API endpoint for testing, proxied environments, or self-hosted deployments:

```ts
const client = new QuikturnLogos({
  token: "qt_your_key",
  baseUrl: "https://logos-proxy.your-company.com",
});
```

### Format Options

Four output formats are supported:

| Format | MIME Type | Shorthand |
|--------|-----------|-----------|
| PNG | `image/png` | `"png"` |
| JPEG | `image/jpeg` | `"jpeg"` |
| WebP | `image/webp` | `"webp"` |
| AVIF | `image/avif` | `"avif"` |

Both the full MIME type and the shorthand alias are accepted:

```ts
// These are equivalent
client.get("github.com", { format: "image/webp" });
client.get("github.com", { format: "webp" });
```

### Theme Options

| Theme | Use Case |
|-------|----------|
| `"light"` | Optimized for light backgrounds |
| `"dark"` | Optimized for dark backgrounds |

## Rate Limits & Quotas

Rate limits and monthly quotas are enforced by the API server and vary by plan. The SDK automatically reads rate-limit headers to provide warnings via the event system and retries with backoff when limits are hit. See [Quikturn pricing](https://getquikturn.io/pricing) for details on your plan's limits.

## Related Packages

### [`@quikturn/logos-react`](https://www.npmjs.com/package/@quikturn/logos-react)

Ready-made React components for displaying Quikturn logos. Includes an infinite scrolling carousel, responsive grid, single logo image, context provider for token propagation, and a `useLogoUrl()` hook. Zero CSS dependencies -- inline styles only.

```bash
pnpm add @quikturn/logos-react @quikturn/logos
```

See the full documentation at [`packages/react/README.md`](./packages/react/README.md).

## License

MIT
