import { logoUrl, type LogoRequestOptions } from "@quikturn/logos";

/**
 * Props matching the Next.js `ImageLoaderProps` interface from `next/image`.
 *
 * - `src`     - The domain string (or image source) passed by Next.js.
 * - `width`   - The resolved width in pixels requested by Next.js.
 * - `quality` - Optional quality hint (unused by the Logos API, included for compatibility).
 */
export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Options for configuring a Quikturn image loader factory.
 *
 * These options are "baked in" to the returned loader function so they
 * don't need to be supplied on every call.
 */
export interface QuikturnImageLoaderOptions {
  token?: string;
  format?: LogoRequestOptions["format"];
  greyscale?: boolean;
  theme?: LogoRequestOptions["theme"];
  baseUrl?: string;
}

/**
 * Basic Quikturn image loader compatible with Next.js `next/image`.
 *
 * Converts a domain + width into a Logos API URL. Does not inject a token
 * or any additional options -- use {@link createQuikturnImageLoader} for that.
 *
 * @example
 * ```tsx
 * import Image from "next/image";
 * import { quikturnImageLoader } from "@quikturn/logos-next";
 *
 * <Image loader={quikturnImageLoader} src="github.com" width={256} height={256} alt="GitHub" />
 * ```
 */
export function quikturnImageLoader({ src, width }: ImageLoaderProps): string {
  return logoUrl(src, { size: width });
}

/**
 * Factory that creates a Quikturn image loader with pre-configured options.
 *
 * The returned function is compatible with Next.js `next/image`'s `loader` prop.
 * Options such as `token`, `format`, `greyscale`, `theme`, and `baseUrl` are
 * captured in the closure so they apply to every call automatically.
 *
 * @example
 * ```tsx
 * import Image from "next/image";
 * import { createQuikturnImageLoader } from "@quikturn/logos-next";
 *
 * const loader = createQuikturnImageLoader({ token: "qt_abc123", format: "webp" });
 *
 * <Image loader={loader} src="github.com" width={256} height={256} alt="GitHub" />
 * ```
 */
export function createQuikturnImageLoader(
  options: QuikturnImageLoaderOptions,
): (props: ImageLoaderProps) => string {
  return ({ src, width }: ImageLoaderProps) =>
    logoUrl(src, {
      token: options.token,
      size: width,
      format: options.format,
      greyscale: options.greyscale,
      theme: options.theme,
      baseUrl: options.baseUrl,
    });
}
