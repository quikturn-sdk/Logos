import { inject } from "vue";
import { QUIKTURN_KEY, type QuikturnContextValue } from "../keys";

export function useQuikturnContext(): QuikturnContextValue | undefined {
  return inject(QUIKTURN_KEY);
}
