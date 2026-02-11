import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { _resetBeacon } from "../src/beacon";

// ---------------------------------------------------------------------------
// Mock next/image — jsdom has no Next.js runtime
// ---------------------------------------------------------------------------
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const loader = props.loader as
      | ((p: { src: string; width: number }) => string)
      | undefined;
    const resolvedSrc = loader
      ? loader({ src: props.src as string, width: (props.width ?? 128) as number })
      : props.src;
    // Strip non-DOM props; map `priority` to a data-attribute so it's testable
    const { loader: _l, priority, ...rest } = props;
    return (
      <img
        {...rest}
        src={resolvedSrc as string}
        data-testid="next-image"
        {...(priority ? { "data-priority": "true" } : {})}
      />
    );
  },
}));

// ---------------------------------------------------------------------------
// Capture beacon Image() calls
// ---------------------------------------------------------------------------
let imageSrcs: string[];
beforeEach(() => {
  _resetBeacon();
  imageSrcs = [];
  vi.stubGlobal(
    "Image",
    class MockImage {
      private _src = "";
      get src() {
        return this._src;
      }
      set src(v: string) {
        this._src = v;
        imageSrcs.push(v);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Import component under test (will fail until implemented)
// ---------------------------------------------------------------------------
import { QuikturnImage } from "../src/QuikturnImage";
import { QuikturnProvider } from "../src/context";

// ===========================================================================
// Tests
// ===========================================================================

describe("QuikturnImage", () => {
  it("renders an img with correct src from domain", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
        alt="GitHub"
      />,
    );
    const img = screen.getByTestId("next-image");
    const src = img.getAttribute("src")!;
    expect(src).toContain("github.com");
    expect(src).toContain("token=qt_abc");
  });

  it("passes width to the loader as size", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={256}
        height={256}
        alt="GitHub"
      />,
    );
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("src")).toContain("size=256");
  });

  it("passes format option to loader", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
        alt="GitHub"
        format="webp"
      />,
    );
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("src")).toContain("format=webp");
  });

  it("passes greyscale option to loader", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
        alt="GitHub"
        greyscale={true}
      />,
    );
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("src")).toContain("greyscale=1");
  });

  it("passes theme option to loader", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
        alt="GitHub"
        theme="dark"
      />,
    );
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("src")).toContain("theme=dark");
  });

  it("generates correct alt text", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
        alt="GitHub"
      />,
    );
    expect(screen.getByAltText("GitHub")).toBeInTheDocument();
  });

  it('defaults alt to "${domain} logo"', () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
      />,
    );
    expect(screen.getByAltText("github.com logo")).toBeInTheDocument();
  });

  it("passes priority prop through", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
        alt="GitHub"
        priority
      />,
    );
    const img = screen.getByTestId("next-image");
    // Our mock maps `priority` to data-priority so we can verify it was forwarded
    expect(img.getAttribute("data-priority")).toBe("true");
  });

  it("passes additional next/image props through", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_abc"
        width={128}
        height={128}
        alt="GitHub"
        className="custom"
      />,
    );
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("class")).toBe("custom");
  });

  it("fires beacon on mount", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="qt_beacon"
        width={128}
        height={128}
        alt="GitHub"
      />,
    );
    expect(imageSrcs.length).toBeGreaterThan(0);
    expect(imageSrcs[0]).toContain("token=qt_beacon");
  });

  it("does not fire beacon for sk_ tokens", () => {
    render(
      <QuikturnImage
        domain="github.com"
        token="sk_secret"
        width={128}
        height={128}
        alt="GitHub"
      />,
    );
    expect(imageSrcs.length).toBe(0);
  });

  it("reads token from QuikturnProvider context", () => {
    render(
      <QuikturnProvider token="qt_ctx">
        <QuikturnImage domain="github.com" width={128} height={128} />
      </QuikturnProvider>,
    );
    const img = screen.getByTestId("next-image");
    expect(img.getAttribute("src")).toContain("token=qt_ctx");
  });
});
