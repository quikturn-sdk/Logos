import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuikturnProvider, useQuikturnContext } from "../src/context";

function ContextConsumer() {
  const ctx = useQuikturnContext();
  return (
    <div data-testid="ctx">
      {ctx ? `${ctx.token}|${ctx.baseUrl ?? "none"}` : "null"}
    </div>
  );
}

describe("QuikturnProvider (Next.js)", () => {
  it("provides token to children via context", () => {
    render(
      <QuikturnProvider token="qt_next_token">
        <ContextConsumer />
      </QuikturnProvider>,
    );
    expect(screen.getByTestId("ctx").textContent).toBe("qt_next_token|none");
  });

  it("provides baseUrl to children", () => {
    render(
      <QuikturnProvider token="qt_next" baseUrl="https://custom.api">
        <ContextConsumer />
      </QuikturnProvider>,
    );
    expect(screen.getByTestId("ctx").textContent).toBe(
      "qt_next|https://custom.api",
    );
  });

  it("returns null when no provider is present", () => {
    render(<ContextConsumer />);
    expect(screen.getByTestId("ctx").textContent).toBe("null");
  });

  it("child component can access context values", () => {
    render(
      <QuikturnProvider token="qt_child_access" baseUrl="https://base.url">
        <ContextConsumer />
      </QuikturnProvider>,
    );
    const el = screen.getByTestId("ctx");
    expect(el.textContent).toContain("qt_child_access");
    expect(el.textContent).toContain("https://base.url");
  });
});
