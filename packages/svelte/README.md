# @quikturn/logos-svelte

> Svelte 5 components for the [Quikturn Logos API](https://getquikturn.io) -- drop-in logo display, infinite carousel, and responsive grid.

**[Get your API key](https://getquikturn.io)** -- free tier available, no credit card required.

## Features

- **`<QuikturnLogo>`** -- single logo image with lazy loading, optional link wrapper
- **`<QuikturnLogoCarousel>`** -- infinite scrolling logo ticker (horizontal or vertical)
- **`<QuikturnLogoGrid>`** -- responsive CSS grid of logos
- **`<QuikturnProvider>`** -- context provider for token and base URL propagation
- **`createLogoUrl()`** -- reactive rune-based composable that returns a derived logo URL
- **`getQuikturnContext()`** -- access the injected token and base URL
- **Zero CSS dependencies** -- inline styles only, no Tailwind or CSS-in-JS required
- **Svelte 5 native** -- runes (`$state`, `$derived`), snippets for custom rendering
- **ESM-only** -- built with `@sveltejs/package`, tree-shakeable

## Installation

```bash
# pnpm (recommended)
pnpm add @quikturn/logos-svelte @quikturn/logos svelte

# npm
npm install @quikturn/logos-svelte @quikturn/logos svelte
```

**Peer dependencies:** `svelte >= 5`, `@quikturn/logos >= 0.1.0`

## Quick Start

### 1. Wrap your app with the provider

```svelte
<!-- +layout.svelte -->
<script>
  import { QuikturnProvider } from "@quikturn/logos-svelte";
</script>

<QuikturnProvider token="qt_your_publishable_key">
  {@render children()}
</QuikturnProvider>
```

### 2. Use components anywhere

```svelte
<script>
  import { QuikturnLogo, QuikturnLogoCarousel } from "@quikturn/logos-svelte";
</script>

<!-- Single logo -->
<QuikturnLogo domain="github.com" size={64} />

<!-- Infinite scrolling carousel -->
<QuikturnLogoCarousel
  domains={["github.com", "stripe.com", "vercel.com", "figma.com"]}
  speed={120}
  logoHeight={28}
  gap={48}
  fadeOut
/>
```

## API Reference

### `<QuikturnProvider>`

Provides `token` and `baseUrl` to all child components via Svelte context. Individual components can override these values with their own props.

```svelte
<QuikturnProvider token="qt_abc123" baseUrl="https://custom.api">
  {@render children()}
</QuikturnProvider>
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `token` | `string` | yes | Publishable API key (`qt_`/`pk_` prefix) |
| `baseUrl` | `string` | no | Override the Quikturn API base URL |
| `children` | `Snippet` | yes | Child content |

---

### `<QuikturnLogo>`

Renders a single logo `<img>`. Optionally wraps in an `<a>` tag when `href` is provided. Validates `href` to reject `javascript:` and `data:` protocols.

```svelte
<QuikturnLogo
  domain="stripe.com"
  size={128}
  format="webp"
  greyscale
  theme="dark"
  alt="Stripe"
  href="https://stripe.com"
  loading="lazy"
  class="my-logo"
  style="border-radius: 8px"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domain` | `string` | **required** | Domain to fetch logo for |
| `token` | `string` | from context | Publishable API key |
| `baseUrl` | `string` | from context | API base URL override |
| `size` | `number` | -- | Logo width in pixels |
| `format` | `string` | -- | `"png"`, `"jpeg"`, `"webp"`, `"avif"`, or MIME type |
| `greyscale` | `boolean` | -- | Greyscale transformation |
| `theme` | `"light" \| "dark"` | -- | Background-optimized rendering |
| `alt` | `string` | `"<domain> logo"` | Image alt text |
| `href` | `string` | -- | Wraps the image in a link |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Native image loading strategy |
| `class` | `string` | -- | CSS class on wrapper element |
| `style` | `string` | -- | Inline styles on wrapper element |
| `onload` | `(event: Event) => void` | -- | Fires when the image loads |
| `onerror` | `(event: Event) => void` | -- | Fires on image load error |

---

### `<QuikturnLogoCarousel>`

Infinite scrolling logo ticker powered by `requestAnimationFrame`. Supports horizontal (left/right) and vertical (up/down) scrolling, hover-based speed changes, fade overlays, and per-logo customization.

```svelte
<QuikturnLogoCarousel
  domains={["github.com", "stripe.com", "vercel.com", "figma.com"]}
  speed={120}
  direction="left"
  logoHeight={28}
  gap={48}
  fadeOut
  fadeOutColor="#f5f5f5"
  pauseOnHover
  scaleOnHover
  width="100%"
/>
```

#### Using `logos` for per-logo configuration

```svelte
<QuikturnLogoCarousel
  logos={[
    { domain: "github.com", href: "https://github.com", alt: "GitHub" },
    { domain: "stripe.com", size: 256, greyscale: true },
    { domain: "vercel.com", theme: "dark" },
  ]}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domains` | `string[]` | -- | Simple list of domains (use this or `logos`) |
| `logos` | `LogoConfig[]` | -- | Per-logo configuration objects (use this or `domains`) |
| `token` | `string` | from context | Publishable API key |
| `baseUrl` | `string` | from context | API base URL override |
| `speed` | `number` | `120` | Scroll speed in pixels per second |
| `direction` | `"left" \| "right" \| "up" \| "down"` | `"left"` | Scroll direction |
| `pauseOnHover` | `boolean` | `false` | Pause scrolling on mouse hover |
| `hoverSpeed` | `number` | -- | Custom speed during hover (`0` = pause, overrides `pauseOnHover`) |
| `logoHeight` | `number` | `28` | Height of each logo image in pixels |
| `gap` | `number` | `32` | Gap between logos in pixels |
| `width` | `number \| string` | `"100%"` | Container width (`600`, `"80%"`, etc.) |
| `fadeOut` | `boolean` | `false` | Show gradient fade overlays at edges |
| `fadeOutColor` | `string` | `"#ffffff"` | Fade overlay color (match your background) |
| `scaleOnHover` | `boolean` | `false` | Scale logos on individual hover |
| `logoSize` | `number` | -- | Default image fetch width for all logos |
| `logoFormat` | `string` | -- | Default image format for all logos |
| `logoGreyscale` | `boolean` | -- | Default greyscale setting for all logos |
| `logoTheme` | `"light" \| "dark"` | -- | Default theme for all logos |
| `renderItem` | `Snippet<[ResolvedLogo, number]>` | -- | Custom snippet renderer per logo |
| `class` | `string` | -- | CSS class on root container |
| `style` | `string` | -- | Inline styles on root container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

#### Custom rendering with snippets

```svelte
<QuikturnLogoCarousel domains={["github.com", "stripe.com"]}>
  {#snippet renderItem(logo, index)}
    <div style="padding: 12px; background: #f9f9f9; border-radius: 8px">
      <img src={logo.url} alt={logo.alt} height={32} />
      <span style="font-size: 10px; color: #666">{logo.domain}</span>
    </div>
  {/snippet}
</QuikturnLogoCarousel>
```

#### `LogoConfig`

Used in the `logos` array prop for per-logo customization:

```ts
interface LogoConfig {
  domain: string;        // Required
  href?: string;         // Wrap in link
  alt?: string;          // Alt text override
  size?: number;         // Per-logo image width
  format?: string;       // Per-logo format
  greyscale?: boolean;   // Per-logo greyscale
  theme?: "light" | "dark";
}
```

---

### `<QuikturnLogoGrid>`

Responsive CSS grid of logos. Each logo is centered in its grid cell.

```svelte
<QuikturnLogoGrid
  domains={["github.com", "stripe.com", "vercel.com", "figma.com"]}
  columns={4}
  gap={24}
  ariaLabel="Our partners"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domains` | `string[]` | -- | Simple list of domains (use this or `logos`) |
| `logos` | `LogoConfig[]` | -- | Per-logo configuration objects |
| `token` | `string` | from context | Publishable API key |
| `baseUrl` | `string` | from context | API base URL override |
| `columns` | `number` | `4` | Number of grid columns |
| `gap` | `number` | `24` | Grid gap in pixels |
| `logoSize` | `number` | -- | Default image fetch width |
| `logoFormat` | `string` | -- | Default image format |
| `logoGreyscale` | `boolean` | -- | Default greyscale |
| `logoTheme` | `"light" \| "dark"` | -- | Default theme |
| `renderItem` | `Snippet<[ResolvedLogo, number]>` | -- | Custom snippet renderer per logo |
| `class` | `string` | -- | CSS class on grid container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

---

### `createLogoUrl(getDomain, getOptions?)`

Reactive composable that returns a derived logo URL using Svelte 5 runes. Pulls `token` and `baseUrl` from context unless overridden. Arguments are getter functions for reactivity.

```svelte
<script>
  import { createLogoUrl } from "@quikturn/logos-svelte";

  let domain = $state("github.com");
  const { url } = createLogoUrl(() => domain, () => ({ size: 256, format: "webp" }));
</script>

<input bind:value={domain} placeholder="Enter a domain" />
<img src={url} alt="{domain} logo" />
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `getDomain` | `() => string` | Getter returning the domain |
| `getOptions` | `() => LogoOptions & { token?: string; baseUrl?: string }` | Getter returning options |

**Returns:** `{ readonly url: string }` -- object with a reactive `url` getter

---

### `getQuikturnContext()`

Returns the token and base URL injected by `<QuikturnProvider>`. Returns `undefined` if no provider is present.

```svelte
<script>
  import { getQuikturnContext } from "@quikturn/logos-svelte";

  const ctx = getQuikturnContext();
  // ctx?.token, ctx?.baseUrl
</script>
```

---

## Examples

### Logo Wall (Marketing Page)

```svelte
<script>
  import { QuikturnLogoCarousel } from "@quikturn/logos-svelte";

  const partners = [
    "github.com", "stripe.com", "vercel.com", "figma.com",
    "linear.app", "notion.so", "slack.com", "discord.com",
  ];
</script>

<h2>Trusted by industry leaders</h2>
<QuikturnLogoCarousel
  domains={partners}
  speed={80}
  logoHeight={32}
  gap={64}
  fadeOut
  pauseOnHover
/>
```

### Partner Grid with Links

```svelte
<script>
  import { QuikturnLogoGrid } from "@quikturn/logos-svelte";

  const partners = [
    { domain: "github.com", href: "https://github.com", alt: "GitHub" },
    { domain: "stripe.com", href: "https://stripe.com", alt: "Stripe" },
    { domain: "vercel.com", href: "https://vercel.com", alt: "Vercel" },
    { domain: "figma.com", href: "https://figma.com", alt: "Figma" },
  ];
</script>

<QuikturnLogoGrid logos={partners} columns={2} gap={32} />
```

### Vertical Carousel

```svelte
<div style="height: 240px">
  <QuikturnLogoCarousel
    domains={["github.com", "stripe.com", "vercel.com"]}
    direction="up"
    speed={60}
    logoHeight={24}
  />
</div>
```

### Reactive Domain Input

```svelte
<script>
  import { createLogoUrl } from "@quikturn/logos-svelte";

  let domain = $state("github.com");
  const { url } = createLogoUrl(() => domain, () => ({ size: 256, format: "webp" }));
</script>

<input bind:value={domain} placeholder="Enter a domain" />
<img src={url} alt="{domain} logo" />
```

## Resources

- **[Quikturn website](https://getquikturn.io)** -- sign up, manage keys, explore the API
- **[Dashboard](https://getquikturn.io/dashboard)** -- usage analytics, key management, plan upgrades
- **[Pricing](https://getquikturn.io/pricing)** -- free tier, pro, and enterprise plans
- **[Core SDK docs](https://www.npmjs.com/package/@quikturn/logos)** -- `@quikturn/logos` URL builder, browser client, server client

## License

MIT -- built by [Quikturn](https://getquikturn.io)
