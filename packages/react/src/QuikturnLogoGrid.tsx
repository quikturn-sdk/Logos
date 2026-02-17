import React, { useEffect, useMemo } from "react";
import { logoUrl } from "@quikturn/logos";
import { useQuikturnContext } from "./context";
import { fireBeacon } from "./beacon";
import { isValidHref } from "./validate-href";
import type { QuikturnLogoGridProps, LogoConfig, ResolvedLogo } from "./types";

export function QuikturnLogoGrid({
  domains,
  logos,
  token,
  baseUrl,
  columns = 4,
  gap = 24,
  logoSize,
  logoFormat,
  logoGreyscale,
  logoTheme,
  logoVariant,
  renderItem,
  className,
  style,
  ariaLabel = "Company logos",
}: QuikturnLogoGridProps) {
  const ctx = useQuikturnContext();
  const effectiveToken = token ?? ctx?.token ?? "";
  const effectiveBaseUrl = baseUrl ?? ctx?.baseUrl;

  const resolvedLogos: ResolvedLogo[] = useMemo(() => {
    const items: LogoConfig[] =
      logos ?? (domains ?? []).map((d) => ({ domain: d }));
    return items.map((item) => ({
      domain: item.domain,
      alt: item.alt ?? `${item.domain} logo`,
      href: item.href,
      url: logoUrl(item.domain, {
        token: effectiveToken || undefined,
        size: item.size ?? logoSize,
        format: item.format ?? logoFormat,
        greyscale: item.greyscale ?? logoGreyscale,
        theme: item.theme ?? logoTheme,
        variant: item.variant ?? logoVariant,
        baseUrl: effectiveBaseUrl,
      }),
    }));
  }, [
    domains,
    logos,
    effectiveToken,
    effectiveBaseUrl,
    logoSize,
    logoFormat,
    logoGreyscale,
    logoTheme,
    logoVariant,
  ]);

  useEffect(() => {
    if (effectiveToken) fireBeacon(effectiveToken);
  }, [effectiveToken]);

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        alignItems: "center",
        justifyItems: "center",
        ...style,
      }}
    >
      {resolvedLogos.map((logo, i) =>
        renderItem ? (
          <React.Fragment key={logo.domain}>
            {renderItem(logo, i)}
          </React.Fragment>
        ) : (
          <div
            key={logo.domain}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {logo.href && isValidHref(logo.href) ? (
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={logo.alt}
              >
                <img
                  src={logo.url}
                  alt={logo.alt}
                  loading="lazy"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </a>
            ) : (
              <img
                src={logo.url}
                alt={logo.alt}
                loading="lazy"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            )}
          </div>
        ),
      )}
    </div>
  );
}
