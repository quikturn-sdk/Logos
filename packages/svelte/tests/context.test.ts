import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import ContextConsumer from "./helpers/ContextConsumer.svelte";
import ProviderWithConsumer from "./helpers/ProviderWithConsumer.svelte";
import NestedProvider from "./helpers/NestedProvider.svelte";

describe("QuikturnProvider + context", () => {
  it("renders children", () => {
    render(ProviderWithConsumer, { token: "qt_test" });
    expect(screen.getByTestId("ctx")).toBeInTheDocument();
  });

  it("provides token to child components", () => {
    render(ProviderWithConsumer, { token: "qt_abc" });
    expect(screen.getByTestId("ctx").textContent?.trim()).toBe("qt_abc|none");
  });

  it("provides baseUrl to child components", () => {
    render(ProviderWithConsumer, {
      token: "qt_abc",
      baseUrl: "https://custom.api",
    });
    expect(screen.getByTestId("ctx").textContent?.trim()).toBe(
      "qt_abc|https://custom.api",
    );
  });

  it("nested provider overrides parent", () => {
    render(NestedProvider, {
      outerToken: "qt_outer",
      innerToken: "qt_inner",
    });
    expect(screen.getByTestId("ctx").textContent?.trim()).toBe("qt_inner|none");
  });

  it("returns undefined when no provider wraps the consumer", () => {
    render(ContextConsumer);
    expect(screen.getByTestId("ctx").textContent?.trim()).toBe("null");
  });
});
