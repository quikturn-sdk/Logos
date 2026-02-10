import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuikturnLogo } from "../src/QuikturnLogo";
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

describe("QuikturnLogo", () => {
  it("renders img with correct src from logoUrl", () => {
    render(<QuikturnLogo domain="github.com" token="qt_abc" />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain(`${BASE_URL}/github.com`);
    expect(img.getAttribute("src")).toContain("token=qt_abc");
  });

  it('defaults alt to "${domain} logo"', () => {
    render(<QuikturnLogo domain="stripe.com" />);
    expect(screen.getByAltText("stripe.com logo")).toBeInTheDocument();
  });

  it("uses custom alt when provided", () => {
    render(<QuikturnLogo domain="github.com" alt="GitHub" />);
    expect(screen.getByAltText("GitHub")).toBeInTheDocument();
  });

  it("wraps in <a> when href is provided", () => {
    render(
      <QuikturnLogo domain="github.com" href="https://github.com" />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not wrap in <a> when href is absent", () => {
    render(<QuikturnLogo domain="github.com" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("uses lazy loading by default", () => {
    render(<QuikturnLogo domain="github.com" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });

  it("applies className to wrapper", () => {
    const { container } = render(
      <QuikturnLogo domain="github.com" className="my-logo" />,
    );
    expect(container.querySelector(".my-logo")).not.toBeNull();
  });

  it("applies style to wrapper", () => {
    const { container } = render(
      <QuikturnLogo domain="github.com" style={{ opacity: 0.5 }} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe("0.5");
  });

  it("fires beacon on mount with token", () => {
    render(<QuikturnLogo domain="github.com" token="qt_beacon" />);
    expect(imageSrcs.length).toBeGreaterThan(0);
    expect(imageSrcs[0]).toContain("token=qt_beacon");
  });

  it("uses token from QuikturnProvider context", () => {
    render(
      <QuikturnProvider token="qt_ctx_token">
        <QuikturnLogo domain="github.com" />
      </QuikturnProvider>,
    );
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("token=qt_ctx_token");
  });

  it("uses baseUrl from QuikturnProvider context", () => {
    render(
      <QuikturnProvider token="qt_t" baseUrl="https://custom.api">
        <QuikturnLogo domain="github.com" />
      </QuikturnProvider>,
    );
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("https://custom.api/github.com");
  });

  it("applies size to logoUrl", () => {
    render(<QuikturnLogo domain="github.com" size={256} />);
    expect(screen.getByRole("img").getAttribute("src")).toContain("size=256");
  });

  it("applies format to logoUrl", () => {
    render(<QuikturnLogo domain="github.com" format="webp" />);
    expect(screen.getByRole("img").getAttribute("src")).toContain(
      "format=webp",
    );
  });
});
