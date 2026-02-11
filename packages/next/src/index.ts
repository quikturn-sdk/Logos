// Next.js-specific exports
export { QuikturnImage } from "./QuikturnImage";
export type { QuikturnImageProps } from "./QuikturnImage";
export {
  quikturnImageLoader,
  createQuikturnImageLoader,
} from "./loader";
export type {
  ImageLoaderProps,
  QuikturnImageLoaderOptions,
} from "./loader";
export { QuikturnProvider, useQuikturnContext } from "./context";

// Re-export everything from @quikturn/logos-react for convenience
export {
  QuikturnLogo,
  QuikturnLogoCarousel,
  QuikturnLogoGrid,
  useLogoUrl,
} from "@quikturn/logos-react";
export type {
  LogoOptions,
  LogoConfig,
  ResolvedLogo,
  QuikturnLogoProps,
  QuikturnLogoCarouselProps,
  QuikturnLogoGridProps,
} from "@quikturn/logos-react";
