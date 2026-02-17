import Image, { type ImageProps } from "next/image";
import { logoUrl, type LogoRequestOptions } from "@quikturn/logos";
import { useEffect, useMemo } from "react";
import { fireBeacon } from "./beacon";
import { useQuikturnContext } from "./context";

/**
 * Props accepted by the `QuikturnImage` component.
 *
 * Extends all `next/image` props except `src` and `loader` (which are
 * derived from the `domain` and logo-specific options).
 */
export interface QuikturnImageProps
  extends Omit<ImageProps, "src" | "loader"> {
  /** The domain to fetch a logo for (e.g. "github.com"). */
  domain: string;
  /** Publishable API token (qt_ / pk_ prefix). Overrides context token. */
  token?: string;
  /** Output image format. */
  format?: LogoRequestOptions["format"];
  /** When true, returns a greyscale logo. */
  greyscale?: boolean;
  /** Theme adjustment ("light" or "dark"). */
  theme?: LogoRequestOptions["theme"];
  /** Logo variant ("full" or "icon"). */
  variant?: LogoRequestOptions["variant"];
}

/**
 * Next.js `<Image>` wrapper that renders a Quikturn logo for the given domain.
 *
 * Automatically constructs a custom `loader` using `logoUrl()` from
 * `@quikturn/logos`, fires an attribution beacon on mount, and supports
 * reading a token from `<QuikturnProvider>` context.
 *
 * @example
 * ```tsx
 * <QuikturnImage domain="github.com" token="qt_abc" width={128} height={128} alt="GitHub" />
 * ```
 */
export function QuikturnImage({
  domain,
  token,
  format,
  greyscale,
  theme,
  variant,
  alt,
  ...imageProps
}: QuikturnImageProps) {
  const ctx = useQuikturnContext();
  const effectiveToken = token ?? ctx?.token ?? "";

  // Build the loader that next/image will call with { src, width }
  const loader = useMemo(
    () =>
      ({ src, width }: { src: string; width: number }) =>
        logoUrl(src, {
          token: effectiveToken || undefined,
          size: width,
          format,
          greyscale,
          theme,
          variant,
        }),
    [effectiveToken, format, greyscale, theme, variant],
  );

  // Fire attribution beacon on mount (skipped for sk_ tokens and SSR)
  useEffect(() => {
    if (effectiveToken) fireBeacon(effectiveToken);
  }, [effectiveToken]);

  return (
    <Image
      {...imageProps}
      src={domain}
      loader={loader}
      alt={alt ?? `${domain} logo`}
    />
  );
}
