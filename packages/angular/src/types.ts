import type { SupportedOutputFormat, FormatShorthand, ThemeOption, LogoVariant } from "@quikturn/logos";

/** Configuration for provideQuikturnLogos(). */
export interface QuikturnConfig {
  token: string;
  baseUrl?: string;
}

/** Options that control logo image generation. */
export interface LogoOptions {
  size?: number;
  format?: SupportedOutputFormat | FormatShorthand;
  greyscale?: boolean;
  theme?: ThemeOption;
  variant?: LogoVariant;
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

/** Public input interface for the QuikturnLogoComponent. */
export interface QuikturnLogoInputs {
  domain: string;
  token?: string;
  baseUrl?: string;
  size?: number;
  format?: string;
  greyscale?: boolean;
  theme?: string;
  variant?: string;
  alt?: string;
  href?: string;
  class?: string;
  loading?: "lazy" | "eager";
}

/** Public input interface for the QuikturnLogoGridComponent. */
export interface QuikturnLogoGridInputs {
  domains?: string[];
  logos?: LogoConfig[];
  token?: string;
  baseUrl?: string;
  columns?: number;
  gap?: number;
  logoSize?: number;
  logoFormat?: string;
  logoGreyscale?: boolean;
  logoTheme?: string;
  logoVariant?: string;
  class?: string;
  ariaLabel?: string;
}

/** Public input interface for the QuikturnLogoCarouselComponent. */
export interface QuikturnLogoCarouselInputs {
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
  logoFormat?: string;
  logoGreyscale?: boolean;
  logoTheme?: string;
  logoVariant?: string;
  class?: string;
  ariaLabel?: string;
}
