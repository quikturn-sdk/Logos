// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import svelte from "eslint-plugin-svelte";
import angular from "angular-eslint";
import reactHooks from "eslint-plugin-react-hooks";

/** Shared TypeScript rules applied across all source files. */
const sharedTsRules = {
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
  "@typescript-eslint/no-explicit-any": "error",
};

export default tseslint.config(
  // ── Global ignores ───────────────────────────────────────────
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.svelte-kit/**",
      "examples/**",
    ],
  },

  // ── Core SDK: TypeScript source ──────────────────────────────
  {
    files: ["src/**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: sharedTsRules,
  },

  // ── React + Next.js: TypeScript & TSX ────────────────────────
  {
    files: [
      "packages/react/src/**/*.{ts,tsx}",
      "packages/next/src/**/*.{ts,tsx}",
    ],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...sharedTsRules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ── Vue: TypeScript + SFCs ───────────────────────────────────
  {
    files: ["packages/vue/src/**/*.{ts,vue}"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...pluginVue.configs["flat/recommended"],
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      ...sharedTsRules,
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-self-closing": [
        "warn",
        { html: { void: "any", normal: "always", component: "always" } },
      ],
      "vue/require-default-prop": "off",
    },
  },

  // ── Svelte: plain TypeScript files ───────────────────────────
  {
    files: ["packages/svelte/src/**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: sharedTsRules,
  },

  // ── Svelte: Svelte components only ───────────────────────────
  {
    files: ["packages/svelte/src/**/*.svelte"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...svelte.configs["flat/recommended"],
    ],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      ...sharedTsRules,
      // Svelte $props() destructuring uses `let`, not `const`
      "prefer-const": "off",
    },
  },

  // ── Angular: TypeScript with inline templates ────────────────
  {
    files: ["packages/angular/src/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      ...sharedTsRules,
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "quikturn", style: "kebab-case" },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "quikturn", style: "camelCase" },
      ],
      "@angular-eslint/prefer-standalone": "error",
      "@angular-eslint/no-input-rename": "off",
    },
  },

  // ── All test files: relaxed rules ────────────────────────────
  {
    files: ["tests/**/*.{ts,tsx}", "packages/*/tests/**/*.{ts,tsx}"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
