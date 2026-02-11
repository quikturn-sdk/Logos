import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
      tsconfigPath: "./tsconfig.lib.json",
      afterBuild() {
        // vite-plugin-dts only emits .d.ts -- copy it to .d.cts for CJS consumers
        const dist = resolve(__dirname, "dist");
        copyFileSync(resolve(dist, "index.d.ts"), resolve(dist, "index.d.cts"));
      },
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      external: [/^@angular\//, "@quikturn/logos", "rxjs"],
    },
  },
});
