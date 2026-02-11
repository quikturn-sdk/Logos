# @quikturn/logos-angular

Angular components for the [Quikturn Logos API](https://logos.quikturn.com) -- fetch polished company logos by domain. Built with standalone components and signal inputs for Angular 17+.

## Install

```bash
npm install @quikturn/logos-angular @quikturn/logos
```

Or with pnpm:

```bash
pnpm add @quikturn/logos-angular @quikturn/logos
```

## Setup

Provide your Quikturn API token at the application level using `provideQuikturnLogos()`:

```typescript
// app.config.ts
import { ApplicationConfig } from "@angular/core";
import { provideQuikturnLogos } from "@quikturn/logos-angular";

export const appConfig: ApplicationConfig = {
  providers: [
    provideQuikturnLogos({ token: "qt_your_token" }),
  ],
};
```

All components, pipes, and signal functions will automatically inherit this token.

## Components

### `<quikturn-logo>`

Renders a single logo image. Standalone component with signal inputs.

```typescript
import { Component } from "@angular/core";
import { QuikturnLogoComponent } from "@quikturn/logos-angular";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [QuikturnLogoComponent],
  template: `<quikturn-logo domain="github.com" />`,
})
export class ExampleComponent {}
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `domain` | `string` | -- | Domain to fetch logo for (required) |
| `token` | `string` | -- | Override provider token |
| `baseUrl` | `string` | -- | Override provider base URL |
| `alt` | `string` | `"${domain} logo"` | Image alt text |
| `href` | `string` | -- | Wrap image in a link |
| `class` | `string` | -- | CSS class on wrapper element |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Image loading strategy |
| `size` | `number` | -- | Logo width in pixels |
| `format` | `string` | -- | Output format (`"png"`, `"webp"`, `"jpeg"`, `"avif"`) |
| `greyscale` | `boolean` | -- | Render in greyscale |
| `theme` | `string` | -- | Theme option (`"light"` or `"dark"`) |

---

### `<quikturn-logo-grid>`

Grid layout of logos with optional custom templates.

```typescript
import { Component } from "@angular/core";
import { QuikturnLogoGridComponent } from "@quikturn/logos-angular";

@Component({
  selector: "app-grid",
  standalone: true,
  imports: [QuikturnLogoGridComponent],
  template: `
    <quikturn-logo-grid
      [domains]="['github.com', 'google.com', 'apple.com', 'microsoft.com']"
      [columns]="2"
      [gap]="16"
    />
  `,
})
export class GridComponent {}
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
| `domains` | `string[]` | -- | Array of domains to display |
| `logos` | `LogoConfig[]` | -- | Detailed per-logo configuration |
| `token` | `string` | -- | Override provider token |
| `baseUrl` | `string` | -- | Override provider base URL |
| `columns` | `number` | `4` | Number of grid columns |
| `gap` | `number` | `24` | Gap between items in pixels |
| `logoSize` | `number` | -- | Default logo size for all items |
| `logoFormat` | `string` | -- | Default logo format for all items |
| `logoGreyscale` | `boolean` | -- | Default greyscale for all items |
| `logoTheme` | `string` | -- | Default theme for all items |
| `class` | `string` | -- | CSS class on the grid container |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

---

### `<quikturn-logo-carousel>`

Infinite scrolling logo carousel with smooth animation.

```typescript
import { Component } from "@angular/core";
import { QuikturnLogoCarouselComponent } from "@quikturn/logos-angular";

@Component({
  selector: "app-carousel",
  standalone: true,
  imports: [QuikturnLogoCarouselComponent],
  template: `
    <quikturn-logo-carousel
      [domains]="['github.com', 'google.com', 'apple.com', 'amazon.com', 'netflix.com']"
      [speed]="80"
      [pauseOnHover]="true"
      [fadeOut]="true"
    />
  `,
})
export class CarouselComponent {}
```

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `domains` | `string[]` | -- | Array of domains to display |
| `logos` | `LogoConfig[]` | -- | Detailed per-logo configuration |
| `token` | `string` | -- | Override provider token |
| `baseUrl` | `string` | -- | Override provider base URL |
| `speed` | `number` | `120` | Scroll speed in pixels per second |
| `direction` | `"left" \| "right" \| "up" \| "down"` | `"left"` | Scroll direction |
| `pauseOnHover` | `boolean` | -- | Pause scrolling on hover |
| `hoverSpeed` | `number` | -- | Speed when hovered (0 = pause) |
| `logoHeight` | `number` | `28` | Logo height in pixels |
| `gap` | `number` | `32` | Gap between logos in pixels |
| `width` | `number \| string` | `"100%"` | Container width |
| `fadeOut` | `boolean` | `false` | Show fade overlays at edges |
| `fadeOutColor` | `string` | `"#ffffff"` | Fade gradient color |
| `scaleOnHover` | `boolean` | `false` | Scale logos on hover |
| `logoSize` | `number` | -- | Default logo size option |
| `logoFormat` | `string` | -- | Default logo format option |
| `logoGreyscale` | `boolean` | -- | Default greyscale option |
| `logoTheme` | `string` | -- | Default theme option |
| `class` | `string` | -- | CSS class on root element |
| `ariaLabel` | `string` | `"Company logos"` | Accessible label for the region |

---

## Pipe

### `logoUrl`

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

## Signal Function

### `injectLogoUrl()`

Signal-based helper that builds a reactive logo URL. Must be called within an injection context.

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

The returned signal recomputes automatically whenever any input signal changes.

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

## API Reference

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

## Requirements

- Angular **17+** with standalone components
- `@quikturn/logos` (peer dependency, installed alongside)

## License

MIT
