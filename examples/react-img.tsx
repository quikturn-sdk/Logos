/**
 * Example: React <img> with URL Builder
 *
 * Uses the universal `logoUrl()` function to generate logo URLs
 * for use in React components. No network wrapper needed -- just
 * drop the URL into an <img> tag.
 *
 * This approach is ideal when you want a simple, static logo image
 * without blob management, scrape polling, or metadata parsing.
 */

import { logoUrl } from "@quikturn/logos";
import type { ThemeOption, FormatShorthand } from "@quikturn/logos";

// ---------------------------------------------------------------------------
// CompanyLogo Component
// ---------------------------------------------------------------------------

interface CompanyLogoProps {
  /** Domain to fetch the logo for (e.g. "github.com"). */
  domain: string;
  /** Publishable API key (qt_ or pk_ prefix). */
  token: string;
  /** Output width in pixels. Default: 128. Max: 800 for publishable keys. */
  size?: number;
  /** Output image format shorthand: "png", "jpeg", "webp", or "avif". */
  format?: FormatShorthand;
  /** Theme adjustment: "light" (gamma 0.9) or "dark" (gamma 1.12). */
  theme?: ThemeOption;
  /** Whether to return a greyscale image. */
  greyscale?: boolean;
  /** Alt text for the image. Defaults to "{domain} logo". */
  alt?: string;
  /** CSS class name(s) to apply to the <img> element. */
  className?: string;
}

/**
 * Renders a company logo as a standard <img> element.
 *
 * The `logoUrl()` function builds a fully-qualified URL pointing to the
 * Quikturn Logos API. The browser fetches the image directly -- no SDK
 * client instance or blob URL management required.
 */
export function CompanyLogo({
  domain,
  token,
  size = 128,
  format,
  theme,
  greyscale,
  alt,
  className,
}: CompanyLogoProps) {
  const src = logoUrl(domain, { token, size, format, theme, greyscale });

  return (
    <img
      src={src}
      alt={alt ?? `${domain} logo`}
      width={size}
      height={size}
      className={className}
      loading="lazy"
    />
  );
}

// ---------------------------------------------------------------------------
// Usage in a page component
// ---------------------------------------------------------------------------

export function CompanyList() {
  const token = "qt_your_publishable_key";

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {/* Default PNG at 64px */}
      <CompanyLogo domain="github.com" token={token} size={64} />

      {/* Dark theme variant */}
      <CompanyLogo domain="google.com" token={token} size={64} theme="dark" />

      {/* WebP format for smaller payload */}
      <CompanyLogo domain="stripe.com" token={token} size={64} format="webp" />

      {/* Greyscale logo */}
      <CompanyLogo
        domain="linear.app"
        token={token}
        size={64}
        greyscale
        alt="Linear greyscale logo"
      />
    </div>
  );
}
