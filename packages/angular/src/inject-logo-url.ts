import {
  inject,
  computed,
  assertInInjectionContext,
  type Signal,
} from "@angular/core";
import { logoUrl } from "@quikturn/logos";
import { QUIKTURN_CONFIG } from "./providers";

/**
 * Signal-based helper that builds a logo URL from reactive inputs.
 * Must be called within an Angular injection context (component constructor,
 * `runInInjectionContext`, etc.).
 *
 * Returns a computed signal containing the full logo URL string.
 * The URL recomputes automatically whenever any input signal changes.
 *
 * @param options - Reactive getters for domain, token, baseUrl, and logo options.
 * @returns A read-only `Signal<string>` with the computed logo URL.
 */
export function injectLogoUrl(options: {
  domain: () => string;
  token?: () => string | undefined;
  baseUrl?: () => string | undefined;
  size?: () => number | undefined;
  format?: () => string | undefined;
  greyscale?: () => boolean | undefined;
  theme?: () => string | undefined;
  variant?: () => string | undefined;
}): Signal<string> {
  assertInInjectionContext(injectLogoUrl);

  const config = inject(QUIKTURN_CONFIG, { optional: true });

  return computed(() => {
    const token = options.token?.() ?? config?.token;
    const baseUrl = options.baseUrl?.() ?? config?.baseUrl;

    return logoUrl(options.domain(), {
      token,
      baseUrl,
      size: options.size?.(),
      format: options.format?.() as Parameters<typeof logoUrl>[1] extends
        | infer O
        | undefined
        ? O extends { format?: infer F }
          ? F
          : never
        : never,
      greyscale: options.greyscale?.(),
      theme: options.theme?.() as "light" | "dark" | undefined,
      variant: options.variant?.() as "full" | "icon" | undefined,
    });
  });
}
