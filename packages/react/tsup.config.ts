import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  outDir: "dist",
  platform: "browser",
  external: ["react", "react-dom", "react/jsx-runtime", "@quikturn/logos"],
  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".cjs" };
  },
});
