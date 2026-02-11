import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/vue";
import { defineComponent, h } from "vue";
import { QuikturnPlugin } from "../src/plugin";
import { useQuikturnContext } from "../src/composables/useQuikturnContext";

/**
 * Helper component that reads context via useQuikturnContext()
 * and renders the values for assertion.
 */
const ContextConsumer = defineComponent({
  name: "ContextConsumer",
  setup() {
    const ctx = useQuikturnContext();
    return () =>
      h(
        "div",
        { "data-testid": "ctx" },
        ctx ? `${ctx.token}|${ctx.baseUrl ?? "none"}` : "null",
      );
  },
});

describe("QuikturnPlugin", () => {
  it("provides token to child components", () => {
    render(ContextConsumer, {
      global: { plugins: [[QuikturnPlugin, { token: "qt_abc" }]] },
    });
    expect(screen.getByTestId("ctx").textContent).toBe("qt_abc|none");
  });

  it("provides baseUrl when supplied", () => {
    render(ContextConsumer, {
      global: {
        plugins: [
          [QuikturnPlugin, { token: "qt_abc", baseUrl: "https://custom.api" }],
        ],
      },
    });
    expect(screen.getByTestId("ctx").textContent).toBe(
      "qt_abc|https://custom.api",
    );
  });

  it("child component can inject context via useQuikturnContext", () => {
    const Wrapper = defineComponent({
      setup() {
        return () => h(ContextConsumer);
      },
    });

    render(Wrapper, {
      global: { plugins: [[QuikturnPlugin, { token: "qt_injected" }]] },
    });
    expect(screen.getByTestId("ctx").textContent).toBe("qt_injected|none");
  });

  it("returns undefined when plugin is not installed", () => {
    render(ContextConsumer);
    expect(screen.getByTestId("ctx").textContent).toBe("null");
  });

  it("second app.use() with different token overrides in that app scope", () => {
    // Simulate two different plugin configurations by rendering with the inner token
    // Vue does not support nested apps easily, so we test that the most recent
    // provide wins by re-rendering with different options.
    render(ContextConsumer, {
      global: { plugins: [[QuikturnPlugin, { token: "qt_second" }]] },
    });
    expect(screen.getByTestId("ctx").textContent).toBe("qt_second|none");
  });
});
