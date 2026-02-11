import type { LogoOptions } from "./types.js";
export declare function createLogoUrl(getDomain: () => string, getOptions?: () => (LogoOptions & {
    token?: string;
    baseUrl?: string;
}) | undefined): {
    readonly url: string;
};
//# sourceMappingURL=createLogoUrl.svelte.d.ts.map