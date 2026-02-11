# @quikturn/logos-vue

> Vue 3 components for the [Quikturn Logos API](https://getquikturn.io) -- drop-in logo display, infinite carousel, and responsive grid.

**[Get your API key](https://getquikturn.io)** -- free tier available, no credit card required.

## Features

- **`<QuikturnLogo>`** -- single logo image with lazy loading, optional link wrapper
- **`<QuikturnLogoCarousel>`** -- infinite scrolling logo ticker (horizontal or vertical)
- **`<QuikturnLogoGrid>`** -- responsive CSS grid of logos
- **`QuikturnPlugin`** -- Vue plugin for token and base URL propagation via `provide`/`inject`
- **`useLogoUrl()`** -- composable that returns a computed Quikturn logo URL
- **`useQuikturnContext()`** -- composable to access the injected token and base URL
- **Zero CSS dependencies** -- inline styles only, no Tailwind or CSS-in-JS required
- **Tree-shakeable** -- ESM and CJS dual builds; import only what you use

## Installation

```bash
# pnpm (recommended)
pnpm add @quikturn/logos-vue @quikturn/logos vue

# npm
npm install @quikturn/logos-vue @quikturn/logos vue
```

**Peer dependencies:** `vue >= 3.3`, `@quikturn/logos >= 0.1.0`

## Quick Start

### 1. Install the plugin in your app entry

```ts
// main.ts
import { createApp } from "vue";
import { QuikturnPlugin } from "@quikturn/logos-vue";
import App from "./App.vue";

const app = createApp(App);
app.use(QuikturnPlugin, { token: "qt_your_publishable_key" });
app.mount("#app");
```

### 2. Use components anywhere in your app

```vue
<script setup lang="ts">
import { QuikturnLogo, QuikturnLogoCarousel } from "@quikturn/logos-vue";
</script>

<template>
  <!-- Single logo -->
  <QuikturnLogo domain="github.com" :size="64" />

  <!-- Infinite scrolling carousel -->
  <QuikturnLogoCarousel
    :domains="['github.com', 'stripe.com', 'vercel.com', 'figma.com']"
    :speed="120"
    :logo-height="28"
    :gap="48"
    fade-out
  />
</template>
```

## API Reference

### `QuikturnPlugin`

Vue plugin that provides `token` and `baseUrl` to all nested components via `provide`/`inject`. Individual components can override these values with their own props.

```ts
app.use(QuikturnPlugin, {
  token: "qt_abc123",
  baseUrl: "https://custom.api", // optional
});
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `token` | `string` | yes | Publishable API key (`qt_`/`pk_` prefix) |
| `baseUrl` | `string` | no | Override the Quikturn API base URL |

---

### `<QuikturnLogo>`

Renders a single logo `<img>`. Optionally wraps in an `<a>` tag when `href` is provided.

```vue
<QuikturnLogo
  domain="stripe.com"
  :size="128"
  format="webp"
  greyscale
  theme="dark"
  alt="Stripe"
  href="https://stripe.com"
  loading="lazy"
  class="my-logo"
  :style="{ borderRadius: '8px' }"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domain` | `string` | **required** | Domain to fetch logo for |
| `token` | `string` | from plugin | Publishable API key |
| `baseUrl` | `string` | from plugin | API base URL override |
| `size` | `number` | `128` | Logo width in pixels |
| `format` | `string` | `"image/png"` | `"png"`, `"jpeg"`, `"webp"`, `"avif"`, or MIME type |
| `greyscale` | `boolean` | `false` | Greyscale transformation |
| `theme` | `"light" \| "dark"` | -- | Background-optimized rendering |
| `alt` | `string` | `"<domain> logo"` | Image alt text |
| `href` | `string` | -- | Wraps the image in a link |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Native image loading strategy |
| `class` | `string` | -- | CSS class on wrapper element |
| `style` | `CSSProperties` | -- | Inline styles on wrapper element |

---

### `<QuikturnLogoCarousel>`

Infinite scrolling logo ticker powered by `requestAnimationFrame`. Supports horizontal (left/right) and vertical (up/down) scrolling, hover-based speed changes, fade overlays, and per-logo customization.

```vue
<QuikturnLogoCarousel
  :domains="['github.com', 'stripe.com', 'vercel.com', 'figma.com']"
  :speed="120"
  direction="left"
  :logo-height="28"
  :gap="48"
  fade-out
  fade-out-color="#f5f5f5"
  pause-on-hover
  scale-on-hover
  width="100%"
/>
```

#### Using `logos` for per-logo configuration

```vue
<QuikturnLogoCarousel
  :logos="[
    { domain: 'github.com', href: 'https://github.com', alt: 'GitHub' },
    { domain: 'stripe.com', size: 256, greyscale: true },
    { domain: 'vercel.com', theme: 'dark' },
  ]"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domains` | `string[]` | -- | Simple list of domains (use this or `logos`) |
| `logos` | `LogoConfig[]` | -- | Per-logo configuration objects (use this or `domains`) |
| `token` | `string` | from plugin | Publishable API key |
| `baseUrl` | `string` | from plugin | API base URL override |
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
| `logoSize` | `number` | `128` | Default image fetch width for all logos |
| `logoFormat` | `string` | -- | Default image format for all logos |
| `logoGreyscale` | `boolean` | -- | Default greyscale setting for all logos |
| `logoTheme` | `"light" \| "dark"` | -- | Default theme for all logos |
| `renderItem` | `(logo: ResolvedLogo, index: number) => VNode` | -- | Custom render function per logo |
| `class` | `string` | -- | CSS class on root container |
| `style` | `CSSProperties` | -- | Inline styles on root container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

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

```vue
<QuikturnLogoGrid
  :domains="['github.com', 'stripe.com', 'vercel.com', 'figma.com']"
  :columns="4"
  :gap="24"
  aria-label="Our partners"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domains` | `string[]` | -- | Simple list of domains (use this or `logos`) |
| `logos` | `LogoConfig[]` | -- | Per-logo configuration objects |
| `token` | `string` | from plugin | Publishable API key |
| `baseUrl` | `string` | from plugin | API base URL override |
| `columns` | `number` | `4` | Number of grid columns |
| `gap` | `number` | `24` | Grid gap in pixels |
| `logoSize` | `number` | `128` | Default image fetch width |
| `logoFormat` | `string` | -- | Default image format |
| `logoGreyscale` | `boolean` | -- | Default greyscale |
| `logoTheme` | `"light" \| "dark"` | -- | Default theme |
| `renderItem` | `(logo: ResolvedLogo, index: number) => VNode` | -- | Custom render function per logo |
| `class` | `string` | -- | CSS class on grid container |
| `style` | `CSSProperties` | -- | Inline styles on grid container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

---

### `useLogoUrl(domain, options?)`

Composable that returns a `ComputedRef<string>` for a Quikturn logo URL. Pulls `token` and `baseUrl` from the plugin unless overridden. Both arguments accept refs or getters for reactivity.

```vue
<script setup lang="ts">
import { useLogoUrl } from "@quikturn/logos-vue";

const url = useLogoUrl("github.com", { size: 256, format: "webp" });
</script>

<template>
  <img :src="url" alt="GitHub" />
</template>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `domain` | `string \| Ref<string> \| () => string` | Domain to build URL for |
| `options.token` | `string` | Override plugin token |
| `options.baseUrl` | `string` | Override plugin base URL |
| `options.size` | `number` | Image width in pixels |
| `options.format` | `string` | Output format |
| `options.greyscale` | `boolean` | Greyscale transformation |
| `options.theme` | `"light" \| "dark"` | Theme optimization |

**Returns:** `ComputedRef<string>` -- fully-qualified, reactive logo URL

---

### `useQuikturnContext()`

Composable that returns the token and base URL injected by `QuikturnPlugin`. Returns `undefined` if the plugin has not been installed.

```vue
<script setup lang="ts">
import { useQuikturnContext } from "@quikturn/logos-vue";

const ctx = useQuikturnContext();
// ctx?.token, ctx?.baseUrl
</script>
```

---

## Examples

### Logo Wall (Marketing Page)

```vue
<script setup lang="ts">
import { QuikturnLogoCarousel } from "@quikturn/logos-vue";

const partners = [
  "github.com", "stripe.com", "vercel.com", "figma.com",
  "linear.app", "notion.so", "slack.com", "discord.com",
];
</script>

<template>
  <h2>Trusted by industry leaders</h2>
  <QuikturnLogoCarousel
    :domains="partners"
    :speed="80"
    :logo-height="32"
    :gap="64"
    fade-out
    pause-on-hover
  />
</template>
```

### Partner Grid with Links

```vue
<script setup lang="ts">
import { QuikturnLogoGrid } from "@quikturn/logos-vue";

const partners = [
  { domain: "github.com", href: "https://github.com", alt: "GitHub" },
  { domain: "stripe.com", href: "https://stripe.com", alt: "Stripe" },
  { domain: "vercel.com", href: "https://vercel.com", alt: "Vercel" },
  { domain: "figma.com", href: "https://figma.com", alt: "Figma" },
];
</script>

<template>
  <QuikturnLogoGrid :logos="partners" :columns="2" :gap="32" />
</template>
```

### Vertical Carousel

```vue
<template>
  <div style="height: 240px">
    <QuikturnLogoCarousel
      :domains="['github.com', 'stripe.com', 'vercel.com']"
      direction="up"
      :speed="60"
      :logo-height="24"
    />
  </div>
</template>
```

### Using the Composable Directly

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useLogoUrl } from "@quikturn/logos-vue";

const domain = ref("github.com");
const url = useLogoUrl(domain, { size: 256, format: "webp" });
</script>

<template>
  <input v-model="domain" placeholder="Enter a domain" />
  <img :src="url" :alt="`${domain} logo`" />
</template>
```

## Resources

- **[Quikturn website](https://getquikturn.io)** -- sign up, manage keys, explore the API
- **[Dashboard](https://getquikturn.io/dashboard)** -- usage analytics, key management, plan upgrades
- **[Pricing](https://getquikturn.io/pricing)** -- free tier, pro, and enterprise plans
- **[Core SDK docs](https://www.npmjs.com/package/@quikturn/logos)** -- `@quikturn/logos` URL builder, browser client, server client

## License

MIT -- built by [Quikturn](https://getquikturn.io)
