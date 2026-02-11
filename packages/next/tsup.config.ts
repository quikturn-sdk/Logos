import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    treeshake: true,
    clean: true,
    outDir: "dist",
    platform: "browser",
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "next",
      "next/image",
      "@quikturn/logos",
      "@quikturn/logos-react",
    ],
    outExtension({ format }) {
      return { js: format === "esm" ? ".mjs" : ".cjs" };
    },
    banner: { js: '"use client";' },
  },
  {
    entry: { server: "src/index.server.ts" },
    format: ["esm", "cjs"],
    dts: true,
    treeshake: true,
    outDir: "dist",
    platform: "node",
    external: [
      "server-only",
      "@quikturn/logos",
      "@quikturn/logos/server",
    ],
    outExtension({ format }) {
      return { js: format === "esm" ? ".mjs" : ".cjs" };
    },
  },
]);
