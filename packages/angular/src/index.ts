// Providers
export { QUIKTURN_CONFIG, provideQuikturnLogos } from "./providers";

// Signal functions
export { injectLogoUrl } from "./inject-logo-url";

// Pipe
export { LogoUrlPipe } from "./logo-url.pipe";

// Components
export { QuikturnLogoComponent } from "./quikturn-logo.component";
export { QuikturnLogoGridComponent } from "./quikturn-logo-grid.component";
export { QuikturnLogoCarouselComponent } from "./quikturn-logo-carousel.component";

// Utilities
export { isValidHref } from "./validate-href";

// Types
export type {
  QuikturnConfig,
  LogoOptions,
  LogoConfig,
  ResolvedLogo,
  QuikturnLogoInputs,
  QuikturnLogoGridInputs,
  QuikturnLogoCarouselInputs,
} from "./types";

// Re-export core types for convenience
export type { SupportedOutputFormat, FormatShorthand, ThemeOption } from "@quikturn/logos";
