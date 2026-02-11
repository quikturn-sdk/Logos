import type { SupportedOutputFormat, FormatShorthand, ThemeOption } from "@quikturn/logos";
import type { Snippet } from "svelte";

/** Options that control logo image generation. */
export interface LogoOptions {
  size?: number;
  format?: SupportedOutputFormat | FormatShorthand;
  greyscale?: boolean;
  theme?: ThemeOption;
}

/** Per-logo configuration in carousel/grid components. */
export interface LogoConfig extends LogoOptions {
  domain: string;
  href?: string;
  alt?: string;
}

/** Internal resolved logo with pre-built URL. */
export interface ResolvedLogo {
  domain: string;
  url: string;
  alt: string;
  href?: string;
}

/** Props for the QuikturnLogo component. */
export interface QuikturnLogoProps extends LogoOptions {
  domain: string;
  token?: string;
  baseUrl?: string;
  alt?: string;
  href?: string;
  class?: string;
  style?: string;
  loading?: "lazy" | "eager";
  onerror?: (event: Event) => void;
  onload?: (event: Event) => void;
}

/** Props for the QuikturnLogoCarousel component. */
export interface QuikturnLogoCarouselProps {
  domains?: string[];
  logos?: LogoConfig[];
  token?: string;
  baseUrl?: string;
  speed?: number;
  direction?: "left" | "right" | "up" | "down";
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  logoHeight?: number;
  gap?: number;
  width?: number | string;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  logoSize?: number;
  logoFormat?: SupportedOutputFormat | FormatShorthand;
  logoGreyscale?: boolean;
  logoTheme?: ThemeOption;
  renderItem?: Snippet<[ResolvedLogo, number]>;
  class?: string;
  style?: string;
  ariaLabel?: string;
}

/** Props for the QuikturnLogoGrid component. */
export interface QuikturnLogoGridProps {
  domains?: string[];
  logos?: LogoConfig[];
  token?: string;
  baseUrl?: string;
  columns?: number;
  gap?: number;
  logoSize?: number;
  logoFormat?: SupportedOutputFormat | FormatShorthand;
  logoGreyscale?: boolean;
  logoTheme?: ThemeOption;
  renderItem?: Snippet<[ResolvedLogo, number]>;
  class?: string;
  ariaLabel?: string;
}

/** Props for the QuikturnProvider component. */
export interface QuikturnProviderProps {
  token: string;
  baseUrl?: string;
  children: Snippet;
}
