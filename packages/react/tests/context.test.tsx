import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuikturnProvider } from "../src/context";
import { useQuikturnContext } from "../src/context";

function ContextConsumer() {
  const ctx = useQuikturnContext();
  return (
    <div data-testid="ctx">
      {ctx ? `${ctx.token}|${ctx.baseUrl ?? "none"}` : "null"}
    </div>
  );
}

describe("QuikturnProvider", () => {
  it("renders children", () => {
    render(
      <QuikturnProvider token="qt_test">
        <span>child</span>
      </QuikturnProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("provides token to child components", () => {
    render(
      <QuikturnProvider token="qt_abc">
        <ContextConsumer />
      </QuikturnProvider>,
    );
    expect(screen.getByTestId("ctx").textContent).toBe("qt_abc|none");
  });

  it("provides baseUrl to child components", () => {
    render(
      <QuikturnProvider token="qt_abc" baseUrl="https://custom.api">
        <ContextConsumer />
      </QuikturnProvider>,
    );
    expect(screen.getByTestId("ctx").textContent).toBe(
      "qt_abc|https://custom.api",
    );
  });

  it("nested provider overrides parent", () => {
    render(
      <QuikturnProvider token="qt_outer">
        <QuikturnProvider token="qt_inner">
          <ContextConsumer />
        </QuikturnProvider>
      </QuikturnProvider>,
    );
    expect(screen.getByTestId("ctx").textContent).toBe("qt_inner|none");
  });

  it("returns null when no provider", () => {
    render(<ContextConsumer />);
    expect(screen.getByTestId("ctx").textContent).toBe("null");
  });
});
