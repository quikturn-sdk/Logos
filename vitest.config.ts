import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "client",
          include: ["tests/client/**/*.test.ts"],
          environment: "jsdom",
        },
      },
      {
        test: {
          name: "server",
          include: ["tests/server/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
      thresholds: {
        branches: 90,
        lines: 95,
        functions: 95,
        statements: 95,
      },
    },
  },
});
