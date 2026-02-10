import { defineConfig } from "tsup";

const esmCjsExtensions = {
  outExtension({ format }: { format: string }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    };
  },
};

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    treeshake: true,
    outDir: "dist",
    ...esmCjsExtensions,
  },
  {
    entry: { "client/index": "src/client/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    treeshake: true,
    outDir: "dist",
    platform: "browser",
    ...esmCjsExtensions,
  },
  {
    entry: { "server/index": "src/server/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    treeshake: true,
    outDir: "dist",
    platform: "node",
    target: "node22",
    ...esmCjsExtensions,
  },
  {
    entry: { "element/index": "src/element/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    treeshake: true,
    outDir: "dist",
    platform: "browser",
    ...esmCjsExtensions,
  },
]);
