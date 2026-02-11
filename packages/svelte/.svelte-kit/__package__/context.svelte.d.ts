export interface QuikturnContextValue {
    readonly token: string;
    readonly baseUrl?: string;
}
/**
 * Sets the Quikturn context for descendant components.
 * Accepts getter functions so the context remains reactive to prop changes.
 */
export declare function setQuikturnContext(getToken: () => string, getBaseUrl: () => string | undefined): void;
/** Retrieves the Quikturn context set by an ancestor QuikturnProvider. */
export declare function getQuikturnContext(): QuikturnContextValue | undefined;
//# sourceMappingURL=context.svelte.d.ts.map