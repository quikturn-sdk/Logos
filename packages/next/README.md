# @quikturn/logos-next

> Next.js components for the [Quikturn Logos API](https://getquikturn.io) -- `<QuikturnImage>` with `next/image` integration, image loaders, and server helpers.

**[Get your API key](https://getquikturn.io)** -- free tier available, no credit card required.

## Features

- **`<QuikturnImage>`** -- `next/image` wrapper that renders a Quikturn logo with automatic optimization
- **`quikturnImageLoader`** -- basic Next.js image loader for the Logos API
- **`createQuikturnImageLoader()`** -- factory for pre-configured image loaders with token, format, theme
- **`<QuikturnProvider>`** -- context provider for token and base URL propagation
- **Server helpers** -- `getServerClient()` and `getLogoBuffer()` for API routes and server components
- **Re-exports** -- all `@quikturn/logos-react` components (`QuikturnLogo`, `QuikturnLogoCarousel`, `QuikturnLogoGrid`, `useLogoUrl`)
- **Tree-shakeable** -- ESM and CJS dual builds; import only what you use

## Installation

```bash
# pnpm (recommended)
pnpm add @quikturn/logos-next @quikturn/logos @quikturn/logos-react next react react-dom

# npm
npm install @quikturn/logos-next @quikturn/logos @quikturn/logos-react next react react-dom
```

**Peer dependencies:** `next >= 14`, `react >= 18`, `react-dom >= 18`

## Quick Start

```tsx
import { QuikturnProvider, QuikturnImage } from "@quikturn/logos-next";

export default function Page() {
  return (
    <QuikturnProvider token="qt_your_publishable_key">
      <QuikturnImage domain="github.com" width={128} height={128} alt="GitHub" />
    </QuikturnProvider>
  );
}
```

## API Reference

### `<QuikturnImage>`

A `next/image` wrapper that renders a Quikturn logo for the given domain. Automatically constructs a custom `loader`, fires an attribution beacon on mount, and reads a token from `<QuikturnProvider>` context when available.

```tsx
<QuikturnImage
  domain="stripe.com"
  width={256}
  height={256}
  format="webp"
  greyscale
  theme="dark"
  alt="Stripe"
  priority
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domain` | `string` | **required** | Domain to fetch logo for |
| `token` | `string` | from context | Publishable API key (`qt_`/`pk_` prefix) |
| `format` | `string` | -- | Output format (`"png"`, `"jpeg"`, `"webp"`, `"avif"`, or MIME type) |
| `greyscale` | `boolean` | `false` | Greyscale transformation |
| `theme` | `"light" \| "dark"` | -- | Background-optimized rendering |
| `width` | `number` | **required** | Image width in pixels (from `next/image`) |
| `height` | `number` | **required** | Image height in pixels (from `next/image`) |
| `alt` | `string` | `"<domain> logo"` | Image alt text |
| `priority` | `boolean` | `false` | Disable lazy loading (from `next/image`) |
| ...rest | `ImageProps` | -- | All other `next/image` props are forwarded |

---

### `quikturnImageLoader`

Basic image loader compatible with `next/image`. Converts a domain + width into a Logos API URL without any pre-configured options.

```tsx
import Image from "next/image";
import { quikturnImageLoader } from "@quikturn/logos-next";

<Image
  loader={quikturnImageLoader}
  src="github.com"
  width={256}
  height={256}
  alt="GitHub"
/>
```

---

### `createQuikturnImageLoader(options)`

Factory that creates a pre-configured image loader with baked-in token, format, theme, and other options.

```tsx
import Image from "next/image";
import { createQuikturnImageLoader } from "@quikturn/logos-next";

const loader = createQuikturnImageLoader({
  token: "qt_abc123",
  format: "webp",
  greyscale: true,
});

<Image loader={loader} src="github.com" width={256} height={256} alt="GitHub" />
```

| Option | Type | Description |
|--------|------|-------------|
| `token` | `string` | Publishable API key |
| `format` | `string` | Output format |
| `greyscale` | `boolean` | Greyscale transformation |
| `theme` | `"light" \| "dark"` | Theme optimization |
| `baseUrl` | `string` | Override the Quikturn API base URL |

---

### `<QuikturnProvider>`

Provides `token` and `baseUrl` to all nested `QuikturnImage` components via React Context.

```tsx
<QuikturnProvider token="qt_abc123" baseUrl="https://custom.api">
  {children}
</QuikturnProvider>
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `token` | `string` | yes | Publishable API key (`qt_`/`pk_` prefix) |
| `baseUrl` | `string` | no | Override the Quikturn API base URL |
| `children` | `ReactNode` | yes | Child components |

---

### Server Helpers

Import from `@quikturn/logos-next/server` for use in API routes and server components. This entry point is gated by `server-only` and will throw at build time if imported in client code.

#### `getServerClient()`

Returns a singleton `QuikturnLogos` server client. Reads the `QUIKTURN_SECRET_KEY` environment variable on first call and caches the instance.

#### `getLogoBuffer(domain, options?)`

Convenience wrapper that fetches a logo buffer using the cached server client.

```ts
// app/api/logo/route.ts
import { getLogoBuffer } from "@quikturn/logos-next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") ?? "example.com";

  const result = await getLogoBuffer(domain, { format: "image/webp" });

  return new Response(result.buffer, {
    headers: { "Content-Type": result.contentType },
  });
}
```

**Environment variable required:** `QUIKTURN_SECRET_KEY` (set in `.env.local` or your deployment environment).

---

## Re-exported Components

The following are re-exported from `@quikturn/logos-react` for convenience, so you can import everything from a single package:

- **`<QuikturnLogo>`** -- single logo image with lazy loading and optional link wrapper
- **`<QuikturnLogoCarousel>`** -- infinite scrolling logo ticker
- **`<QuikturnLogoGrid>`** -- responsive CSS grid of logos
- **`useLogoUrl()`** -- hook that returns a memoized Quikturn logo URL

See the [@quikturn/logos-react README](https://www.npmjs.com/package/@quikturn/logos-react) for full documentation on these components.

---

## Examples

### Logo Grid with Next.js Image Optimization

```tsx
import { QuikturnProvider, QuikturnImage } from "@quikturn/logos-next";

const PARTNERS = ["github.com", "stripe.com", "vercel.com", "figma.com"];

export default function Partners() {
  return (
    <QuikturnProvider token="qt_your_key">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {PARTNERS.map((domain) => (
          <QuikturnImage key={domain} domain={domain} width={128} height={128} alt={domain} />
        ))}
      </div>
    </QuikturnProvider>
  );
}
```

### Custom Loader with Global Config

```tsx
// lib/quikturn-loader.ts
import { createQuikturnImageLoader } from "@quikturn/logos-next";

export const logoLoader = createQuikturnImageLoader({
  token: process.env.NEXT_PUBLIC_QUIKTURN_KEY!,
  format: "webp",
});

// app/page.tsx
import Image from "next/image";
import { logoLoader } from "@/lib/quikturn-loader";

export default function Page() {
  return <Image loader={logoLoader} src="github.com" width={64} height={64} alt="GitHub" />;
}
```

### Server-Side Logo Proxy

```ts
// app/api/logo/[domain]/route.ts
import { getLogoBuffer } from "@quikturn/logos-next/server";

export async function GET(
  _request: Request,
  { params }: { params: { domain: string } },
) {
  const result = await getLogoBuffer(params.domain, {
    format: "image/png",
    size: 256,
  });

  return new Response(result.buffer, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
```

## Resources

- **[Quikturn website](https://getquikturn.io)** -- sign up, manage keys, explore the API
- **[Dashboard](https://getquikturn.io/dashboard)** -- usage analytics, key management, plan upgrades
- **[Pricing](https://getquikturn.io/pricing)** -- free tier, pro, and enterprise plans
- **[Core SDK docs](https://www.npmjs.com/package/@quikturn/logos)** -- `@quikturn/logos` URL builder, browser client, server client
- **[React SDK docs](https://www.npmjs.com/package/@quikturn/logos-react)** -- `@quikturn/logos-react` components and hooks

## License

MIT -- built by [Quikturn](https://getquikturn.io)
