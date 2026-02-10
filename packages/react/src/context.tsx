import { createContext, useContext } from "react";
import type { QuikturnProviderProps } from "./types";

interface QuikturnContextValue {
  token: string;
  baseUrl?: string;
}

const QuikturnContext = createContext<QuikturnContextValue | null>(null);

export function useQuikturnContext(): QuikturnContextValue | null {
  return useContext(QuikturnContext);
}

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
