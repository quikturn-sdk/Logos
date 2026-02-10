# @quikturn/logos-react

> React components for the Quikturn Logos API -- drop-in logo display, infinite carousel, and responsive grid.

## Features

- **`<QuikturnLogo>`** -- single logo image with lazy loading, optional link wrapper
- **`<QuikturnLogoCarousel>`** -- infinite scrolling logo ticker (horizontal or vertical)
- **`<QuikturnLogoGrid>`** -- responsive CSS grid of logos
- **`<QuikturnProvider>`** -- context provider for token and base URL propagation
- **`useLogoUrl()`** -- hook that returns a memoized Quikturn logo URL
- **Zero CSS dependencies** -- inline styles only, no Tailwind or CSS-in-JS required
- **Tree-shakeable** -- ESM and CJS dual builds; import only what you use

## Installation

```bash
# pnpm (recommended)
pnpm add @quikturn/logos-react @quikturn/logos react react-dom

# npm
npm install @quikturn/logos-react @quikturn/logos react react-dom
```

**Peer dependencies:** `react >= 18`, `react-dom >= 18`, `@quikturn/logos >= 0.1.0`

## Quick Start

```tsx
import { QuikturnProvider, QuikturnLogo, QuikturnLogoCarousel } from "@quikturn/logos-react";

function App() {
  return (
    <QuikturnProvider token="qt_your_publishable_key">
      {/* Single logo */}
      <QuikturnLogo domain="github.com" size={64} />

      {/* Infinite scrolling carousel */}
      <QuikturnLogoCarousel
        domains={["github.com", "stripe.com", "vercel.com", "figma.com"]}
        speed={120}
        logoHeight={28}
        gap={48}
        fadeOut
      />
    </QuikturnProvider>
  );
}
```

## API Reference

### `<QuikturnProvider>`

Provides `token` and `baseUrl` to all nested components via React Context. Individual components can override these values with their own props.

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

### `<QuikturnLogo>`

Renders a single logo `<img>`. Optionally wraps in an `<a>` tag when `href` is provided.

```tsx
<QuikturnLogo
  domain="stripe.com"
  size={128}
  format="webp"
  greyscale
  theme="dark"
  alt="Stripe"
  href="https://stripe.com"
  loading="lazy"
  className="my-logo"
  style={{ borderRadius: 8 }}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domain` | `string` | **required** | Domain to fetch logo for |
| `token` | `string` | from context | Publishable API key |
| `baseUrl` | `string` | from context | API base URL override |
| `size` | `number` | `128` | Logo width in pixels |
| `format` | `string` | `"image/png"` | `"png"`, `"jpeg"`, `"webp"`, `"avif"`, or MIME type |
| `greyscale` | `boolean` | `false` | Greyscale transformation |
| `theme` | `"light" \| "dark"` | -- | Background-optimized rendering |
| `alt` | `string` | `"<domain> logo"` | Image alt text |
| `href` | `string` | -- | Wraps the image in a link |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Native image loading strategy |
| `className` | `string` | -- | CSS class on wrapper element |
| `style` | `CSSProperties` | -- | Inline styles on wrapper element |
| `onLoad` | `ReactEventHandler` | -- | Fires when the image loads |
| `onError` | `ReactEventHandler` | -- | Fires on image load error |

---

### `<QuikturnLogoCarousel>`

Infinite scrolling logo ticker powered by `requestAnimationFrame`. Supports horizontal (left/right) and vertical (up/down) scrolling, hover-based speed changes, fade overlays, and per-logo customization.

```tsx
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

```tsx
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
| `logoSize` | `number` | `128` | Default image fetch width for all logos |
| `logoFormat` | `string` | -- | Default image format for all logos |
| `logoGreyscale` | `boolean` | -- | Default greyscale setting for all logos |
| `logoTheme` | `"light" \| "dark"` | -- | Default theme for all logos |
| `renderItem` | `(logo, index) => ReactNode` | -- | Custom renderer per logo |
| `className` | `string` | -- | CSS class on root container |
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

```tsx
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
| `logoSize` | `number` | `128` | Default image fetch width |
| `logoFormat` | `string` | -- | Default image format |
| `logoGreyscale` | `boolean` | -- | Default greyscale |
| `logoTheme` | `"light" \| "dark"` | -- | Default theme |
| `renderItem` | `(logo, index) => ReactNode` | -- | Custom renderer per logo |
| `className` | `string` | -- | CSS class on grid container |
| `style` | `CSSProperties` | -- | Inline styles on grid container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

---

### `useLogoUrl(domain, options?)`

Hook that returns a memoized Quikturn logo URL string. Pulls `token` and `baseUrl` from context unless overridden.

```tsx
import { useLogoUrl } from "@quikturn/logos-react";

function MyComponent() {
  const url = useLogoUrl("github.com", { size: 256, format: "webp" });
  return <img src={url} alt="GitHub" />;
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `domain` | `string` | Domain to build URL for |
| `options.token` | `string` | Override context token |
| `options.baseUrl` | `string` | Override context base URL |
| `options.size` | `number` | Image width in pixels |
| `options.format` | `string` | Output format |
| `options.greyscale` | `boolean` | Greyscale transformation |
| `options.theme` | `"light" \| "dark"` | Theme optimization |

**Returns:** `string` -- fully-qualified logo URL

---

## Examples

### Logo Wall (Marketing Page)

```tsx
const PARTNERS = [
  "github.com", "stripe.com", "vercel.com", "figma.com",
  "linear.app", "notion.so", "slack.com", "discord.com",
];

function LogoWall() {
  return (
    <QuikturnProvider token="qt_your_key">
      <h2>Trusted by industry leaders</h2>
      <QuikturnLogoCarousel
        domains={PARTNERS}
        speed={80}
        logoHeight={32}
        gap={64}
        fadeOut
        pauseOnHover
      />
    </QuikturnProvider>
  );
}
```

### Partner Grid with Links

```tsx
function PartnerGrid() {
  return (
    <QuikturnProvider token="qt_your_key">
      <QuikturnLogoGrid
        logos={[
          { domain: "github.com", href: "https://github.com", alt: "GitHub" },
          { domain: "stripe.com", href: "https://stripe.com", alt: "Stripe" },
          { domain: "vercel.com", href: "https://vercel.com", alt: "Vercel" },
          { domain: "figma.com", href: "https://figma.com", alt: "Figma" },
        ]}
        columns={2}
        gap={32}
      />
    </QuikturnProvider>
  );
}
```

### Custom Carousel Item

```tsx
function CustomCarousel() {
  return (
    <QuikturnLogoCarousel
      domains={["github.com", "stripe.com"]}
      token="qt_your_key"
      renderItem={(logo, index) => (
        <div style={{ padding: 12, background: "#f9f9f9", borderRadius: 8 }}>
          <img src={logo.url} alt={logo.alt} height={32} />
          <span style={{ fontSize: 10, color: "#666" }}>{logo.domain}</span>
        </div>
      )}
    />
  );
}
```

### Vertical Carousel

```tsx
<QuikturnLogoCarousel
  domains={["github.com", "stripe.com", "vercel.com"]}
  token="qt_your_key"
  direction="up"
  speed={60}
  logoHeight={24}
/>
```

## License

MIT
