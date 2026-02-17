import { logoUrl } from "@quikturn/logos";
import { getQuikturnContext } from "./context.svelte.js";
import type { LogoOptions } from "./types.js";

export function createLogoUrl(
  getDomain: () => string,
  getOptions?: () => (LogoOptions & { token?: string; baseUrl?: string }) | undefined,
): { readonly url: string } {
  const ctx = getQuikturnContext();
  const url = $derived.by(() => {
    const opts = getOptions?.();
    const token = opts?.token ?? ctx?.token;
    const baseUrl = opts?.baseUrl ?? ctx?.baseUrl;
    return logoUrl(getDomain(), {
      token,
      baseUrl,
      size: opts?.size,
      format: opts?.format,
      greyscale: opts?.greyscale,
      theme: opts?.theme,
      variant: opts?.variant,
    });
  });
  return {
    get url() { return url; },
  };
}
