// Plugin
export { QuikturnPlugin } from "./plugin";

// Composables
export { useQuikturnContext } from "./composables/useQuikturnContext";
export { useLogoUrl } from "./composables/useLogoUrl";

// Components
export { default as QuikturnLogo } from "./components/QuikturnLogo.vue";
export { default as QuikturnLogoGrid } from "./components/QuikturnLogoGrid.vue";
export { default as QuikturnLogoCarousel } from "./components/QuikturnLogoCarousel.vue";

// Types
export type {
  LogoOptions,
  LogoConfig,
  ResolvedLogo,
  QuikturnLogoProps,
  QuikturnLogoCarouselProps,
  QuikturnLogoGridProps,
  QuikturnPluginOptions,
} from "./types";

// Re-export key types from core for convenience
export type { SupportedOutputFormat, FormatShorthand, ThemeOption } from "@quikturn/logos";
