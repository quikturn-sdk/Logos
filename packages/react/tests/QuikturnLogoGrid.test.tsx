import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuikturnLogoGrid } from "../src/QuikturnLogoGrid";
import { QuikturnProvider } from "../src/context";
import { _resetBeacon } from "../src/beacon";
import { BASE_URL } from "@quikturn/logos";

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

const TEST_DOMAINS = ["github.com", "stripe.com", "vercel.com", "figma.com"];

describe("QuikturnLogoGrid", () => {
  it("renders images for each domain", () => {
    render(<QuikturnLogoGrid domains={TEST_DOMAINS} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(TEST_DOMAINS.length);
  });

  it("uses grid layout", () => {
    const { container } = render(
      <QuikturnLogoGrid domains={TEST_DOMAINS} />,
    );
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.display).toBe("grid");
  });

  it("applies columns as grid-template-columns", () => {
    const { container } = render(
      <QuikturnLogoGrid domains={TEST_DOMAINS} columns={3} />,
    );
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
  });

  it("defaults to 4 columns", () => {
    const { container } = render(
      <QuikturnLogoGrid domains={TEST_DOMAINS} />,
    );
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(4, 1fr)");
  });

  it("applies gap", () => {
    const { container } = render(
      <QuikturnLogoGrid domains={TEST_DOMAINS} gap={16} />,
    );
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gap).toBe("16px");
  });

  it('has role="region" with aria-label', () => {
    render(
      <QuikturnLogoGrid domains={TEST_DOMAINS} ariaLabel="Our partners" />,
    );
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-label",
      "Our partners",
    );
  });

  it("uses logoUrl for each image src", () => {
    render(<QuikturnLogoGrid domains={["github.com"]} token="qt_grid" />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(`${BASE_URL}/github.com`);
    expect(img.src).toContain("token=qt_grid");
  });

  it("fires beacon on mount", () => {
    render(
      <QuikturnLogoGrid domains={TEST_DOMAINS} token="qt_grid_beacon" />,
    );
    expect(imageSrcs.length).toBeGreaterThan(0);
    expect(imageSrcs[0]).toContain("token=qt_grid_beacon");
  });

  it("uses token from context", () => {
    render(
      <QuikturnProvider token="qt_grid_ctx">
        <QuikturnLogoGrid domains={["github.com"]} />
      </QuikturnProvider>,
    );
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("token=qt_grid_ctx");
  });

  it("calls renderItem when provided", () => {
    const renderFn = vi.fn((logo, i) => (
      <span key={i}>{logo.domain}</span>
    ));
    render(<QuikturnLogoGrid domains={TEST_DOMAINS} renderItem={renderFn} />);
    expect(renderFn).toHaveBeenCalledTimes(TEST_DOMAINS.length);
  });

  it("applies className and style", () => {
    const { container } = render(
      <QuikturnLogoGrid
        domains={TEST_DOMAINS}
        className="my-grid"
        style={{ maxWidth: "600px" }}
      />,
    );
    const grid = container.querySelector(".my-grid");
    expect(grid).not.toBeNull();
    expect((grid as HTMLElement).style.maxWidth).toBe("600px");
  });

  it("applies logoVariant to all logos", () => {
    render(
      <QuikturnLogoGrid
        domains={["github.com"]}
        token="qt_test"
        logoVariant="icon"
      />,
    );
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("variant=icon");
  });

  it("does not render link for javascript: href in logos", () => {
    render(
      <QuikturnLogoGrid
        logos={[
          { domain: "github.com", href: "javascript:alert(1)" },
          { domain: "stripe.com", href: "https://stripe.com" },
        ]}
      />,
    );
    const links = screen.getAllByRole("link");
    // Only the valid href should produce a link
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://stripe.com");
  });
});
