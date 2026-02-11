import { logoUrl } from "@quikturn/logos";
import { getQuikturnContext } from "./context.svelte.js";
export function createLogoUrl(getDomain, getOptions) {
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
        });
    });
    return {
        get url() { return url; },
    };
}
