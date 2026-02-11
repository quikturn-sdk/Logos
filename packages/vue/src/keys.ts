import type { InjectionKey } from "vue";

export interface QuikturnContextValue {
  token: string;
  baseUrl?: string;
}

export const QUIKTURN_KEY: InjectionKey<QuikturnContextValue> = Symbol("quikturn");
