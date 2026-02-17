import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { logoUrl } from "@quikturn/logos";
import { useQuikturnContext } from "./useQuikturnContext";
import type { LogoOptions } from "../types";

export function useLogoUrl(
  domain: MaybeRefOrGetter<string>,
  options?: MaybeRefOrGetter<(LogoOptions & { token?: string; baseUrl?: string }) | undefined>,
) {
  const ctx = useQuikturnContext();
  return computed(() => {
    const opts = options ? toValue(options) : undefined;
    const token = opts?.token ?? ctx?.token;
    const baseUrl = opts?.baseUrl ?? ctx?.baseUrl;
    return logoUrl(toValue(domain), {
      token,
      baseUrl,
      size: opts?.size,
      format: opts?.format,
      greyscale: opts?.greyscale,
      theme: opts?.theme,
      variant: opts?.variant,
    });
  });
}
