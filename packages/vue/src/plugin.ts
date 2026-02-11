import type { App } from "vue";
import type { QuikturnPluginOptions } from "./types";
import { QUIKTURN_KEY } from "./keys";

export const QuikturnPlugin = {
  install(app: App, options: QuikturnPluginOptions) {
    app.provide(QUIKTURN_KEY, { token: options.token, baseUrl: options.baseUrl });
  },
};
