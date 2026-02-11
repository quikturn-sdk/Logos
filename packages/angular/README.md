# @quikturn/logos-angular

> Angular components for the [Quikturn Logos API](https://getquikturn.io) -- drop-in logo display, infinite carousel, and responsive grid. Built with standalone components and signal inputs for Angular 17+.

**[Get your API key](https://getquikturn.io)** -- free tier available, no credit card required.

## Features

- **`<quikturn-logo>`** -- single logo image with lazy loading, optional link wrapper
- **`<quikturn-logo-carousel>`** -- infinite scrolling logo ticker (horizontal or vertical)
- **`<quikturn-logo-grid>`** -- responsive CSS grid of logos with custom template support
- **`provideQuikturnLogos()`** -- DI-based configuration for token and base URL
- **`injectLogoUrl()`** -- signal-based reactive logo URL builder
- **`logoUrl` pipe** -- template pipe for domain-to-URL conversion
- **Zero CSS dependencies** -- inline styles only, no Angular Material required
- **Standalone components** -- no `NgModule` needed, import directly
- **Signal inputs** -- modern Angular patterns with `input()` and `output()`

## Installation

```bash
# pnpm (recommended)
pnpm add @quikturn/logos-angular @quikturn/logos

# npm
npm install @quikturn/logos-angular @quikturn/logos
```

**Peer dependencies:** Angular `>= 17`, `@quikturn/logos >= 0.1.0`

## Quick Start

### 1. Provide your token at the application level

```typescript
// app.config.ts
import { ApplicationConfig } from "@angular/core";
import { provideQuikturnLogos } from "@quikturn/logos-angular";

export const appConfig: ApplicationConfig = {
  providers: [
    provideQuikturnLogos({ token: "qt_your_publishable_key" }),
  ],
};
```

### 2. Import and use components

```typescript
import { Component } from "@angular/core";
import { QuikturnLogoComponent, QuikturnLogoCarouselComponent } from "@quikturn/logos-angular";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [QuikturnLogoComponent, QuikturnLogoCarouselComponent],
  template: `
    <!-- Single logo -->
    <quikturn-logo domain="github.com" [size]="64" />

    <!-- Infinite scrolling carousel -->
    <quikturn-logo-carousel
      [domains]="['github.com', 'stripe.com', 'vercel.com', 'figma.com']"
      [speed]="120"
      [fadeOut]="true"
      [pauseOnHover]="true"
    />
  `,
})
export class ExampleComponent {}
```

All components, pipes, and signal functions automatically inherit the token from `provideQuikturnLogos()`.

## API Reference

### `provideQuikturnLogos(config)`

Provides Quikturn configuration to the Angular DI system. Call this in your `ApplicationConfig` or a component's `providers` array.

```typescript
provideQuikturnLogos({ token: "qt_abc123", baseUrl: "https://custom.api" })
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `token` | `string` | yes | Publishable API key (`qt_`/`pk_` prefix) |
| `baseUrl` | `string` | no | Override the Quikturn API base URL |

---

### `<quikturn-logo>`

Renders a single logo `<img>`. Optionally wraps in an `<a>` tag when `href` is provided. Validates `href` to reject `javascript:` and `data:` protocols.

```html
<quikturn-logo
  domain="stripe.com"
  [size]="128"
  format="webp"
  [greyscale]="true"
  theme="dark"
  alt="Stripe"
  href="https://stripe.com"
  loading="lazy"
  class="my-logo"
/>
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `domain` | `string` | **required** | Domain to fetch logo for |
| `token` | `string` | from provider | Publishable API key |
| `baseUrl` | `string` | from provider | API base URL override |
| `size` | `number` | -- | Logo width in pixels |
| `format` | `string` | -- | `"png"`, `"jpeg"`, `"webp"`, `"avif"`, or MIME type |
| `greyscale` | `boolean` | -- | Greyscale transformation |
| `theme` | `string` | -- | `"light"` or `"dark"` |
| `alt` | `string` | `"<domain> logo"` | Image alt text |
| `href` | `string` | -- | Wraps the image in a link |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Native image loading strategy |
| `class` | `string` | -- | CSS class on wrapper element |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `imgError` | `Event` | Emitted when the logo image fails to load |
| `imgLoad` | `Event` | Emitted when the logo image loads successfully |

---

### `<quikturn-logo-carousel>`

Infinite scrolling logo ticker powered by `requestAnimationFrame`. Supports horizontal (left/right) and vertical (up/down) scrolling, hover-based speed changes, fade overlays, and per-logo customization.

```html
<quikturn-logo-carousel
  [domains]="['github.com', 'stripe.com', 'vercel.com', 'figma.com']"
  [speed]="120"
  direction="left"
  [logoHeight]="28"
  [gap]="48"
  [fadeOut]="true"
  fadeOutColor="#f5f5f5"
  [pauseOnHover]="true"
  [scaleOnHover]="true"
  width="100%"
/>
```

#### Using `logos` for per-logo configuration

```html
<quikturn-logo-carousel
  [logos]="[
    { domain: 'github.com', href: 'https://github.com', alt: 'GitHub' },
    { domain: 'stripe.com', size: 256, greyscale: true },
    { domain: 'vercel.com', theme: 'dark' }
  ]"
/>
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `domains` | `string[]` | -- | Simple list of domains (use this or `logos`) |
| `logos` | `LogoConfig[]` | -- | Per-logo configuration objects (use this or `domains`) |
| `token` | `string` | from provider | Publishable API key |
| `baseUrl` | `string` | from provider | API base URL override |
| `speed` | `number` | `120` | Scroll speed in pixels per second |
| `direction` | `"left" \| "right" \| "up" \| "down"` | `"left"` | Scroll direction |
| `pauseOnHover` | `boolean` | -- | Pause scrolling on mouse hover |
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
| `logoTheme` | `string` | -- | Default theme for all logos |
| `class` | `string` | -- | CSS class on root container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

#### `LogoConfig`

Used in the `logos` array for per-logo customization:

```typescript
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

### `<quikturn-logo-grid>`

Responsive CSS grid of logos with optional custom templates.

```html
<quikturn-logo-grid
  [domains]="['github.com', 'stripe.com', 'vercel.com', 'figma.com']"
  [columns]="4"
  [gap]="24"
  ariaLabel="Our partners"
/>
```

#### Custom template

```html
<quikturn-logo-grid [domains]="companies">
  <ng-template #renderItem let-logo let-i="index">
    <div class="custom-card">
      <img [src]="logo.url" [alt]="logo.alt" />
      <span>{{ logo.domain }}</span>
    </div>
  </ng-template>
</quikturn-logo-grid>
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `domains` | `string[]` | -- | Simple list of domains (use this or `logos`) |
| `logos` | `LogoConfig[]` | -- | Per-logo configuration objects |
| `token` | `string` | from provider | Publishable API key |
| `baseUrl` | `string` | from provider | API base URL override |
| `columns` | `number` | `4` | Number of grid columns |
| `gap` | `number` | `24` | Grid gap in pixels |
| `logoSize` | `number` | -- | Default image fetch width |
| `logoFormat` | `string` | -- | Default image format |
| `logoGreyscale` | `boolean` | -- | Default greyscale |
| `logoTheme` | `string` | -- | Default theme |
| `class` | `string` | -- | CSS class on grid container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

---

### `logoUrl` Pipe

Transform a domain string into a logo URL directly in templates.

```typescript
import { Component } from "@angular/core";
import { LogoUrlPipe } from "@quikturn/logos-angular";

@Component({
  selector: "app-pipe-demo",
  standalone: true,
  imports: [LogoUrlPipe],
  template: `
    <img [src]="'github.com' | logoUrl" alt="GitHub logo" />
    <img [src]="'google.com' | logoUrl: { size: 64, format: 'webp' }" alt="Google logo" />
  `,
})
export class PipeDemoComponent {}
```

The pipe reads the token from the `QUIKTURN_CONFIG` injection token. You can override per-use:

```html
<img [src]="'github.com' | logoUrl: { token: 'qt_other_token' }" alt="GitHub" />
```

---

### `injectLogoUrl(options)`

Signal-based helper that builds a reactive logo URL. Must be called within an Angular injection context. The returned signal recomputes automatically whenever any input signal changes.

```typescript
import { Component, signal } from "@angular/core";
import { injectLogoUrl } from "@quikturn/logos-angular";

@Component({
  selector: "app-signal-demo",
  standalone: true,
  template: `<img [src]="logoSrc()" alt="Logo" />`,
})
export class SignalDemoComponent {
  domain = signal("github.com");

  logoSrc = injectLogoUrl({
    domain: () => this.domain(),
    size: () => 128,
    format: () => "webp",
  });
}
```

| Option | Type | Description |
|--------|------|-------------|
| `domain` | `() => string` | Reactive getter for the domain (required) |
| `token` | `() => string \| undefined` | Override the provider token |
| `baseUrl` | `() => string \| undefined` | Override the provider base URL |
| `size` | `() => number \| undefined` | Logo width in pixels |
| `format` | `() => string \| undefined` | Output format |
| `greyscale` | `() => boolean \| undefined` | Greyscale transformation |
| `theme` | `() => string \| undefined` | Theme optimization |

**Returns:** `Signal<string>` -- computed signal with the full logo URL

---

## Types

All types are exported for use in your application:

```typescript
import type {
  QuikturnConfig,
  LogoOptions,
  LogoConfig,
  ResolvedLogo,
  SupportedOutputFormat,
  FormatShorthand,
  ThemeOption,
} from "@quikturn/logos-angular";
```

| Type | Description |
|------|-------------|
| `QuikturnConfig` | Configuration for `provideQuikturnLogos()` (`token`, optional `baseUrl`) |
| `LogoOptions` | Options for logo generation (`size`, `format`, `greyscale`, `theme`) |
| `LogoConfig` | Per-logo config extending `LogoOptions` with `domain`, `href`, `alt` |
| `ResolvedLogo` | Internal resolved logo with pre-built `url`, `domain`, `alt`, `href` |
| `SupportedOutputFormat` | Full format strings (re-exported from `@quikturn/logos`) |
| `FormatShorthand` | Short format aliases (re-exported from `@quikturn/logos`) |
| `ThemeOption` | `"light" \| "dark"` (re-exported from `@quikturn/logos`) |

---

## API Summary

| Export | Kind | Description |
|--------|------|-------------|
| `provideQuikturnLogos()` | Function | Provide config to Angular DI |
| `QUIKTURN_CONFIG` | InjectionToken | Access config directly via `inject()` |
| `injectLogoUrl()` | Function | Signal-based reactive logo URL builder |
| `LogoUrlPipe` | Pipe | Template pipe for domain-to-URL conversion |
| `QuikturnLogoComponent` | Component | Single logo image |
| `QuikturnLogoGridComponent` | Component | Grid layout of logos |
| `QuikturnLogoCarouselComponent` | Component | Infinite scrolling carousel |

---

## Examples

### Logo Wall (Marketing Page)

```typescript
@Component({
  selector: "app-logo-wall",
  standalone: true,
  imports: [QuikturnLogoCarouselComponent],
  template: `
    <h2>Trusted by industry leaders</h2>
    <quikturn-logo-carousel
      [domains]="partners"
      [speed]="80"
      [logoHeight]="32"
      [gap]="64"
      [fadeOut]="true"
      [pauseOnHover]="true"
    />
  `,
})
export class LogoWallComponent {
  partners = [
    "github.com", "stripe.com", "vercel.com", "figma.com",
    "linear.app", "notion.so", "slack.com", "discord.com",
  ];
}
```

### Partner Grid with Links

```typescript
@Component({
  selector: "app-partner-grid",
  standalone: true,
  imports: [QuikturnLogoGridComponent],
  template: `
    <quikturn-logo-grid [logos]="partners" [columns]="2" [gap]="32" />
  `,
})
export class PartnerGridComponent {
  partners: LogoConfig[] = [
    { domain: "github.com", href: "https://github.com", alt: "GitHub" },
    { domain: "stripe.com", href: "https://stripe.com", alt: "Stripe" },
    { domain: "vercel.com", href: "https://vercel.com", alt: "Vercel" },
    { domain: "figma.com", href: "https://figma.com", alt: "Figma" },
  ];
}
```

### Vertical Carousel

```html
<div style="height: 240px">
  <quikturn-logo-carousel
    [domains]="['github.com', 'stripe.com', 'vercel.com']"
    direction="up"
    [speed]="60"
    [logoHeight]="24"
  />
</div>
```

### Signal-Based Reactive URL

```typescript
@Component({
  selector: "app-reactive",
  standalone: true,
  template: `
    <input [(ngModel)]="domain" placeholder="Enter a domain" />
    <img [src]="logoSrc()" [alt]="domain() + ' logo'" />
  `,
})
export class ReactiveComponent {
  domain = signal("github.com");
  logoSrc = injectLogoUrl({
    domain: () => this.domain(),
    size: () => 256,
    format: () => "webp",
  });
}
```

## Resources

- **[Quikturn website](https://getquikturn.io)** -- sign up, manage keys, explore the API
- **[Dashboard](https://getquikturn.io/dashboard)** -- usage analytics, key management, plan upgrades
- **[Pricing](https://getquikturn.io/pricing)** -- free tier, pro, and enterprise plans
- **[Core SDK docs](https://www.npmjs.com/package/@quikturn/logos)** -- `@quikturn/logos` URL builder, browser client, server client

## License

MIT -- built by [Quikturn](https://getquikturn.io)
