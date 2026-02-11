import { describe, it, expect } from "vitest";
import { render } from "@testing-library/vue";
import { defineComponent, h, unref } from "vue";
import { QuikturnPlugin } from "../src/plugin";
import { useLogoUrl } from "../src/composables/useLogoUrl";
import { BASE_URL } from "@quikturn/logos";
import type { QuikturnPluginOptions } from "../src/types";

/**
 * Renders a test component that calls useLogoUrl inside setup(),
 * captures the result, and renders the computed URL as text content.
 */
function renderWithPlugin(
  composableFn: () => ReturnType<typeof useLogoUrl>,
  pluginOptions?: QuikturnPluginOptions,
) {
  let result!: ReturnType<typeof useLogoUrl>;
  const TestComponent = defineComponent({
    setup() {
      result = composableFn();
      return () => h("div", { "data-testid": "url" }, unref(result));
    },
  });

  const globalOpts = pluginOptions
    ? { plugins: [[QuikturnPlugin, pluginOptions] as const] }
    : {};

  render(TestComponent, { global: globalOpts });
  return result;
}

describe("useLogoUrl", () => {
  it("returns URL for domain", () => {
    const url = renderWithPlugin(() => useLogoUrl("github.com"));
    expect(unref(url)).toContain(`${BASE_URL}/github.com`);
  });

  it("includes token from options", () => {
    const url = renderWithPlugin(() =>
      useLogoUrl("github.com", { token: "qt_abc" }),
    );
    expect(unref(url)).toContain("token=qt_abc");
  });

  it("falls back to context token", () => {
    const url = renderWithPlugin(
      () => useLogoUrl("github.com"),
      { token: "qt_ctx" },
    );
    expect(unref(url)).toContain("token=qt_ctx");
  });

  it("options token overrides context token", () => {
    const url = renderWithPlugin(
      () => useLogoUrl("github.com", { token: "qt_prop" }),
      { token: "qt_ctx" },
    );
    expect(unref(url)).toContain("token=qt_prop");
    expect(unref(url)).not.toContain("qt_ctx");
  });

  it("applies size option", () => {
    const url = renderWithPlugin(() =>
      useLogoUrl("github.com", { size: 256 }),
    );
    expect(unref(url)).toContain("size=256");
  });

  it("applies format option", () => {
    const url = renderWithPlugin(() =>
      useLogoUrl("github.com", { format: "webp" }),
    );
    expect(unref(url)).toContain("format=webp");
  });

  it("applies greyscale option", () => {
    const url = renderWithPlugin(() =>
      useLogoUrl("github.com", { greyscale: true }),
    );
    expect(unref(url)).toContain("greyscale=1");
  });

  it("applies theme option", () => {
    const url = renderWithPlugin(() =>
      useLogoUrl("github.com", { theme: "dark" }),
    );
    expect(unref(url)).toContain("theme=dark");
  });

  it("applies baseUrl from context", () => {
    const url = renderWithPlugin(
      () => useLogoUrl("github.com"),
      { token: "qt_t", baseUrl: "https://custom.api" },
    );
    expect(unref(url)).toContain("https://custom.api/github.com");
  });
});
