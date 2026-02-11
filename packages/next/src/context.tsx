import { createContext, useContext } from "react";

interface QuikturnContextValue {
  token: string;
  baseUrl?: string;
}

const QuikturnContext = createContext<QuikturnContextValue | null>(null);

/** Read the current Quikturn context (token + optional baseUrl). */
export function useQuikturnContext(): QuikturnContextValue | null {
  return useContext(QuikturnContext);
}

/** Props for the QuikturnProvider component. */
export interface QuikturnProviderProps {
  token: string;
  baseUrl?: string;
  children: React.ReactNode;
}

/**
 * Provides a Quikturn token (and optional baseUrl) to all descendant
 * `QuikturnImage` components so they don't need an explicit `token` prop.
 */
export function QuikturnProvider({
  token,
  baseUrl,
  children,
}: QuikturnProviderProps) {
  return (
    <QuikturnContext.Provider value={{ token, baseUrl }}>
      {children}
    </QuikturnContext.Provider>
  );
}
