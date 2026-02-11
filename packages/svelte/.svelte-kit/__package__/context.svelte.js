import { getContext, setContext } from "svelte";
const KEY = Symbol("quikturn");
/**
 * Sets the Quikturn context for descendant components.
 * Accepts getter functions so the context remains reactive to prop changes.
 */
export function setQuikturnContext(getToken, getBaseUrl) {
    setContext(KEY, { getToken, getBaseUrl });
}
/** Retrieves the Quikturn context set by an ancestor QuikturnProvider. */
export function getQuikturnContext() {
    const ctx = getContext(KEY);
    if (!ctx)
        return undefined;
    return {
        get token() { return ctx.getToken(); },
        get baseUrl() { return ctx.getBaseUrl(); },
    };
}
