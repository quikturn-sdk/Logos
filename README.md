# @quikturn/logos

TypeScript SDK for the [Quikturn Logos API](https://getquikturn.io) -- fetch any company's logo by domain name.

**[Get your API key](https://getquikturn.io)** -- free tier available, no credit card required.

| Package | Description | |
|---------|-------------|-|
| [`@quikturn/logos`](https://www.npmjs.com/package/@quikturn/logos) | Core SDK -- URL builder, browser client, server client, web component | `pnpm add @quikturn/logos` |
| [`@quikturn/logos-react`](https://www.npmjs.com/package/@quikturn/logos-react) | React components -- logo, carousel, grid | `pnpm add @quikturn/logos-react` |

---

## Install

```bash
pnpm add @quikturn/logos
```

> Requires Node.js >= 18. Works with pnpm, npm, or yarn.
>
> Need an API key? **[Sign up at getquikturn.io](https://getquikturn.io)** -- takes 30 seconds.

## Pick Your Entry Point

| Entry Point | Import | Use Case |
|-------------|--------|----------|
| **Universal** | `@quikturn/logos` | URL builder, types, constants -- zero dependencies, any runtime |
| **Browser** | `@quikturn/logos/client` | Blob URLs, retry/backoff, scrape polling, events |
| **Server** | `@quikturn/logos/server` | Buffer output, streaming, batch operations |
| **Element** | `@quikturn/logos/element` | `<quikturn-logo>` web component with built-in attribution |
| **React** | `@quikturn/logos-react` | `<QuikturnLogo>`, `<QuikturnLogoCarousel>`, `<QuikturnLogoGrid>` |

---

## Quick Start

### URL Builder

The simplest way to get a logo URL. Runs everywhere -- browsers, Node.js, edge runtimes -- with no network calls.

```ts
import { logoUrl } from "@quikturn/logos";

const url = logoUrl("github.com");
// => "https://logos.getquikturn.io/github.com"

const url = logoUrl("stripe.com", {
  token: "qt_abc123",
  size: 256,
  format: "webp",
  greyscale: true,
  theme: "dark",
});
```

### Browser Client

```ts
import { QuikturnLogos } from "@quikturn/logos/client";

const client = new QuikturnLogos({ token: "qt_your_publishable_key" });

const { url, blob, contentType } = await client.get("github.com", {
  size: 256,
  format: "webp",
});

document.querySelector("img")!.src = url;

// Clean up blob URLs when done
client.destroy();
```

### Server Client

```ts
import { QuikturnLogos } from "@quikturn/logos/server";

const client = new QuikturnLogos({ secretKey: "sk_your_secret_key" });

// Single logo
const { buffer, contentType } = await client.get("github.com");

// Batch fetch
for await (const result of client.getMany(["github.com", "stripe.com", "vercel.com"])) {
  if (result.success) console.log(`${result.domain}: ${result.buffer!.byteLength} bytes`);
}

// Stream to file
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";

const stream = await client.getStream("github.com", { format: "png" });
Readable.fromWeb(stream).pipe(createWriteStream("logo.png"));
```

### Web Component

No framework needed. Import the element entry and use it in plain HTML:

```html
<script type="module">
  import "@quikturn/logos/element";
</script>

<quikturn-logo domain="github.com" token="qt_abc123" size="64"></quikturn-logo>
```

Renders the logo with a "Powered by Quikturn" attribution badge protected by shadow DOM.

### React

```bash
pnpm add @quikturn/logos-react
```

```tsx
import { QuikturnProvider, QuikturnLogo, QuikturnLogoCarousel } from "@quikturn/logos-react";

function App() {
  return (
    <QuikturnProvider token="qt_your_key">
      <QuikturnLogo domain="github.com" size={64} />

      <QuikturnLogoCarousel
        domains={["github.com", "stripe.com", "vercel.com", "figma.com"]}
        speed={120}
        fadeOut
        pauseOnHover
      />
    </QuikturnProvider>
  );
}
```

Full React API reference: [`@quikturn/logos-react` docs](./packages/react/README.md)

---

## Authentication

| Key Type | Prefix | Environment | Auth Method |
|----------|--------|-------------|-------------|
| **Publishable** | `qt_` / `pk_` | Browser | Query parameter (`?token=...`) |
| **Secret** | `sk_` | Server only | `Authorization: Bearer` header |

Publishable keys are safe to expose in client-side code (max 800px). Secret keys must never reach the browser (max 1200px). Manage your keys in the [Quikturn dashboard](https://getquikturn.io/dashboard).

```ts
// Browser
import { QuikturnLogos } from "@quikturn/logos/client";
const client = new QuikturnLogos({ token: "qt_your_publishable_key" });

// Server
import { QuikturnLogos } from "@quikturn/logos/server";
const client = new QuikturnLogos({ secretKey: "sk_your_secret_key" });
```

---

## API Reference

### `logoUrl(domain, options?)`

Pure URL builder. No network calls, no side effects.

```ts
import { logoUrl } from "@quikturn/logos";
```

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `token` | `string` | -- | API key appended as query parameter |
| `size` | `number` | `128` | Output width in pixels |
| `width` | `number` | `128` | Alias for `size` |
| `greyscale` | `boolean` | `false` | Desaturation filter |
| `theme` | `"light" \| "dark"` | -- | Background-optimized rendering |
| `format` | `string` | `"image/png"` | `"png"`, `"jpeg"`, `"webp"`, `"avif"` (or full MIME type) |
| `baseUrl` | `string` | `"https://logos.getquikturn.io"` | API base URL override |

**Returns:** `string` | **Throws:** `DomainValidationError`

---

### Browser Client

```ts
import { QuikturnLogos } from "@quikturn/logos/client";
```

#### Constructor

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | `string` | **required** | Publishable key (`qt_`/`pk_` prefix) |
| `baseUrl` | `string` | `"https://logos.getquikturn.io"` | API base URL override |
| `maxRetries` | `number` | `2` | Max retries for 429/5xx responses |

#### Methods

**`client.get(domain, options?)`** -- Fetches a logo and returns a blob URL.

| Option | Type | Default |
|--------|------|---------|
| `size` | `number` | `128` |
| `format` | `string` | `"image/png"` |
| `greyscale` | `boolean` | `false` |
| `theme` | `"light" \| "dark"` | -- |
| `scrapeTimeout` | `number` | -- |
| `onScrapeProgress` | `(event) => void` | -- |
| `signal` | `AbortSignal` | -- |

Returns `Promise<{ url: string, blob: Blob, contentType: string, metadata: LogoMetadata }>`.

**`client.getUrl(domain, options?)`** -- Returns a plain URL string without a network request.

**`client.on(event, handler)`** / **`client.off(event, handler)`** -- Listen for `"rateLimitWarning"` or `"quotaWarning"` events.

**`client.destroy()`** -- Revokes all tracked blob URLs and removes event listeners. Call this to prevent memory leaks.

---

### Server Client

```ts
import { QuikturnLogos } from "@quikturn/logos/server";
```

#### Constructor

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `secretKey` | `string` | **required** | Secret key (`sk_` prefix) |
| `baseUrl` | `string` | `"https://logos.getquikturn.io"` | API base URL override |
| `maxRetries` | `number` | `2` | Max retries for 429/5xx responses |

#### Methods

**`client.get(domain, options?)`** -- Returns `Promise<{ buffer: Buffer, contentType: string, metadata: LogoMetadata }>`.

**`client.getMany(domains, options?)`** -- Batch fetch with concurrency control. Returns `AsyncGenerator<BatchResult>`.

| Option | Type | Default |
|--------|------|---------|
| `concurrency` | `number` | `5` |
| `continueOnError` | `boolean` | `true` |
| `signal` | `AbortSignal` | -- |

**`client.getStream(domain, options?)`** -- Returns `Promise<ReadableStream>` for zero-copy streaming.

**`client.getUrl(domain, options?)`** -- Returns a URL string (secret key NOT included -- use `Authorization` header).

**`client.on(event, handler)`** / **`client.off(event, handler)`** -- Same events as the browser client.

---

### Web Component

```ts
import "@quikturn/logos/element";
```

| Attribute | Type | Description |
|-----------|------|-------------|
| `domain` | `string` | Domain to fetch logo for (required) |
| `token` | `string` | Publishable API key |
| `size` | `string` | Image width in pixels |
| `format` | `string` | `"png"`, `"jpeg"`, `"webp"`, or `"avif"` |
| `greyscale` | (presence) | Greyscale filter when attribute is present |
| `theme` | `string` | `"light"` or `"dark"` |

Auto-registers as `<quikturn-logo>` on import. Shadow DOM protects the attribution badge with `!important` CSS rules.

---

### Error Handling

All errors extend `LogoError` with a typed `code` property for exhaustive `switch` handling:

```ts
import { LogoError } from "@quikturn/logos";

try {
  const { url } = await client.get("example.com");
} catch (err) {
  if (err instanceof LogoError) {
    switch (err.code) {
      case "RATE_LIMIT_ERROR":   /* backoff */  break;
      case "NOT_FOUND_ERROR":    /* fallback */  break;
      case "AUTHENTICATION_ERROR": /* check key */ break;
      // ...
    }
  }
}
```

| Error | Code | Status | Extra Properties |
|-------|------|--------|------------------|
| `DomainValidationError` | `DOMAIN_VALIDATION_ERROR` | -- | `domain` |
| `AuthenticationError` | `AUTHENTICATION_ERROR` | 401 | -- |
| `ForbiddenError` | `FORBIDDEN_ERROR` | 403 | `reason` |
| `NotFoundError` | `NOT_FOUND_ERROR` | 404 | `domain` |
| `BadRequestError` | `BAD_REQUEST_ERROR` | 400 | -- |
| `RateLimitError` | `RATE_LIMIT_ERROR` | 429 | `retryAfter`, `remaining`, `resetAt` |
| `QuotaExceededError` | `QUOTA_EXCEEDED_ERROR` | 429 | `retryAfter`, `limit`, `used` |
| `ScrapeTimeoutError` | `SCRAPE_TIMEOUT_ERROR` | -- | `jobId`, `elapsed` |

---

### Types & Constants

```ts
import type {
  ThemeOption,           // "light" | "dark"
  SupportedOutputFormat, // "image/png" | "image/jpeg" | "image/webp" | "image/avif"
  FormatShorthand,       // "png" | "jpeg" | "webp" | "avif"
  LogoRequestOptions,
  LogoMetadata,
  BrowserLogoResponse,
  ServerLogoResponse,
  ScrapeProgressEvent,
  LogoErrorCode,         // discriminated union of all error codes
} from "@quikturn/logos";
```

| Constant | Value |
|----------|-------|
| `BASE_URL` | `"https://logos.getquikturn.io"` |
| `DEFAULT_WIDTH` | `128` |
| `DEFAULT_FORMAT` | `"image/png"` |
| `SUPPORTED_FORMATS` | `Set` of 4 MIME types |
| `FORMAT_ALIASES` | `{ png, jpeg, webp, avif }` -> MIME mapping |

---

## Configuration

### Custom Base URL

```ts
const client = new QuikturnLogos({
  token: "qt_your_key",
  baseUrl: "https://logos-proxy.your-company.com",
});
```

### Formats

| Format | Shorthand | MIME Type |
|--------|-----------|-----------|
| PNG | `"png"` | `image/png` |
| JPEG | `"jpeg"` | `image/jpeg` |
| WebP | `"webp"` | `image/webp` |
| AVIF | `"avif"` | `image/avif` |

Both forms are accepted: `format: "webp"` and `format: "image/webp"` are equivalent.

### Themes

Use `"light"` for light backgrounds and `"dark"` for dark backgrounds. The API adjusts the logo's color profile to maximize contrast.

## Rate Limits & Quotas

Rate limits and monthly quotas are enforced server-side and vary by plan. The SDK automatically retries with exponential backoff when limits are hit and emits `"rateLimitWarning"` / `"quotaWarning"` events so you can react in your UI. See [pricing & plan details](https://getquikturn.io/pricing).

## Resources

- **[Quikturn website](https://getquikturn.io)** -- sign up, manage keys, explore the API
- **[Dashboard](https://getquikturn.io/dashboard)** -- usage analytics, key management, plan upgrades
- **[Pricing](https://getquikturn.io/pricing)** -- free tier, pro, and enterprise plans
- **[React components](./packages/react/README.md)** -- `@quikturn/logos-react` docs
- **[GitHub](https://github.com/Quikturn-PowerPoint-Add-In/Logo-SDK)** -- source, issues, contributions

## License

MIT -- built by [Quikturn](https://getquikturn.io)
