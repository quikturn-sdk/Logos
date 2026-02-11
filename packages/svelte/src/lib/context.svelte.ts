import { getContext, setContext } from "svelte";

export interface QuikturnContextValue {
  readonly token: string;
  readonly baseUrl?: string;
}

/** Internal reactive context stores getter functions to track prop changes. */
interface QuikturnContextInternal {
  getToken: () => string;
  getBaseUrl: () => string | undefined;
}

const KEY = Symbol("quikturn");

/**
 * Sets the Quikturn context for descendant components.
 * Accepts getter functions so the context remains reactive to prop changes.
 */
export function setQuikturnContext(getToken: () => string, getBaseUrl: () => string | undefined): void {
  setContext<QuikturnContextInternal>(KEY, { getToken, getBaseUrl });
}

/** Retrieves the Quikturn context set by an ancestor QuikturnProvider. */
export function getQuikturnContext(): QuikturnContextValue | undefined {
  const ctx = getContext<QuikturnContextInternal | undefined>(KEY);
  if (!ctx) return undefined;
  return {
    get token() { return ctx.getToken(); },
    get baseUrl() { return ctx.getBaseUrl(); },
  };
}
