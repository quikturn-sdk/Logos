import { useMemo } from "react";
import { logoUrl } from "@quikturn/logos";
import { useQuikturnContext } from "./context";
import type { LogoOptions } from "./types";

export function useLogoUrl(
  domain: string,
  options?: LogoOptions & { token?: string; baseUrl?: string },
): string {
  const ctx = useQuikturnContext();
  const token = options?.token ?? ctx?.token;
  const baseUrl = options?.baseUrl ?? ctx?.baseUrl;

  return useMemo(
    () =>
      logoUrl(domain, {
        token,
        baseUrl,
        size: options?.size,
        format: options?.format,
        greyscale: options?.greyscale,
        theme: options?.theme,
        variant: options?.variant,
      }),
    [domain, token, baseUrl, options?.size, options?.format, options?.greyscale, options?.theme, options?.variant],
  );
}
