import { useEffect, useMemo } from "react";
import { logoUrl } from "@quikturn/logos";
import { useQuikturnContext } from "./context";
import { fireBeacon } from "./beacon";
import type { QuikturnLogoProps } from "./types";

export function QuikturnLogo({
  domain,
  token,
  baseUrl,
  size,
  format,
  greyscale,
  theme,
  alt,
  href,
  className,
  style,
  loading = "lazy",
  onError,
  onLoad,
}: QuikturnLogoProps) {
  const ctx = useQuikturnContext();
  const effectiveToken = token ?? ctx?.token ?? "";
  const effectiveBaseUrl = baseUrl ?? ctx?.baseUrl;

  const src = useMemo(
    () =>
      logoUrl(domain, {
        token: effectiveToken || undefined,
        size,
        format,
        greyscale,
        theme,
        baseUrl: effectiveBaseUrl,
      }),
    [domain, effectiveToken, effectiveBaseUrl, size, format, greyscale, theme],
  );

  useEffect(() => {
    if (effectiveToken) fireBeacon(effectiveToken);
  }, [effectiveToken]);

  const imgEl = (
    <img
      src={src}
      alt={alt ?? `${domain} logo`}
      loading={loading}
      onError={onError}
      onLoad={onLoad}
    />
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {imgEl}
      </a>
    );
  }

  if (className || style) {
    return (
      <span className={className} style={style}>
        {imgEl}
      </span>
    );
  }

  return imgEl;
}
