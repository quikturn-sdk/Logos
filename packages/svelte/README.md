# @quikturn/logos-svelte

Svelte 5 components for the [Quikturn Logos API](https://logos.quikturn.com) -- fetch polished company logos by domain.

## Install

```bash
pnpm add @quikturn/logos-svelte @quikturn/logos svelte
```

## Quick Start

```svelte
<script>
  import { QuikturnProvider, QuikturnLogo } from "@quikturn/logos-svelte";
</script>

<QuikturnProvider token="qt_your_token">
  <QuikturnLogo domain="github.com" />
</QuikturnProvider>
```

## Components

### `<QuikturnProvider>`

Provides token and baseUrl to all child components.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `token` | `string` | Yes | API token (`qt_` or `pk_` prefix) |
| `baseUrl` | `string` | No | Custom API base URL |

---

### `<QuikturnLogo>`

Renders a single logo image.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domain` | `string` | -- | Domain to fetch logo for |
| `token` | `string` | -- | Override provider token |
| `baseUrl` | `string` | -- | Override provider base URL |
| `alt` | `string` | `"${domain} logo"` | Image alt text |
| `href` | `string` | -- | Wrap in link |
| `class` | `string` | -- | CSS class |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Loading strategy |
| `size` | `number` | -- | Logo size |
| `format` | `string` | -- | Output format |
| `greyscale` | `boolean` | -- | Greyscale filter |
| `theme` | `string` | -- | Light/dark theme |

---

### `<QuikturnLogoGrid>`

Grid layout of logos.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domains` | `string[]` | -- | Domains to display |
| `logos` | `LogoConfig[]` | -- | Detailed logo configs |
| `columns` | `number` | `4` | Grid columns |
| `gap` | `number` | `24` | Gap in pixels |
| `ariaLabel` | `string` | `"Company logos"` | Accessibility label |
| `renderItem` | `Snippet` | -- | Custom item renderer |

---

### `<QuikturnLogoCarousel>`

Infinite scrolling logo carousel.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `domains` | `string[]` | -- | Domains to display |
| `logos` | `LogoConfig[]` | -- | Detailed logo configs |
| `speed` | `number` | `120` | Pixels per second |
| `direction` | `"left" \| "right" \| "up" \| "down"` | `"left"` | Scroll direction |
| `pauseOnHover` | `boolean` | `false` | Pause on hover |
| `fadeOut` | `boolean` | `false` | Fade edge overlays |
| `logoHeight` | `number` | `28` | Logo height in px |
| `gap` | `number` | `32` | Gap between logos |
| `renderItem` | `Snippet` | -- | Custom item renderer |

---

### `createLogoUrl`

Reactive composable that returns a derived URL.

```svelte
<script>
  import { createLogoUrl } from "@quikturn/logos-svelte";
  const { url } = createLogoUrl(() => "github.com", () => ({ token: "qt_abc" }));
</script>
<img src={url} alt="GitHub" />
```

## License

MIT
