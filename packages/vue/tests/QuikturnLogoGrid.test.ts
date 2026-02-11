import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/vue";
import { h } from "vue";
import QuikturnLogoGrid from "../src/components/QuikturnLogoGrid.vue";
import { QuikturnPlugin } from "../src/plugin";
import { _resetBeacon } from "../src/beacon";
import { BASE_URL } from "@quikturn/logos";
import type { ResolvedLogo } from "../src/types";

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
    render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS },
    });
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(TEST_DOMAINS.length);
  });

  it("uses grid layout", () => {
    const { container } = render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS },
    });
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.display).toBe("grid");
  });

  it("applies columns as grid-template-columns", () => {
    const { container } = render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS, columns: 3 },
    });
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
  });

  it("defaults to 4 columns", () => {
    const { container } = render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS },
    });
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(4, 1fr)");
  });

  it("applies gap", () => {
    const { container } = render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS, gap: 16 },
    });
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gap).toBe("16px");
  });

  it('has role="region" with aria-label', () => {
    render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS, ariaLabel: "Our partners" },
    });
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-label",
      "Our partners",
    );
  });

  it("uses logoUrl for each image src", () => {
    render(QuikturnLogoGrid, {
      props: { domains: ["github.com"], token: "qt_grid" },
    });
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(`${BASE_URL}/github.com`);
    expect(img.src).toContain("token=qt_grid");
  });

  it("fires beacon on mount", () => {
    render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS, token: "qt_grid_beacon" },
    });
    expect(imageSrcs.length).toBeGreaterThan(0);
    expect(imageSrcs[0]).toContain("token=qt_grid_beacon");
  });

  it("uses token from context", () => {
    render(QuikturnLogoGrid, {
      props: { domains: ["github.com"] },
      global: { plugins: [[QuikturnPlugin, { token: "qt_grid_ctx" }]] },
    });
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("token=qt_grid_ctx");
  });

  it("calls renderItem when provided", () => {
    const renderFn = vi.fn((logo: ResolvedLogo, i: number) =>
      h("span", { key: i }, logo.domain),
    );
    render(QuikturnLogoGrid, {
      props: { domains: TEST_DOMAINS, renderItem: renderFn },
    });
    expect(renderFn).toHaveBeenCalledTimes(TEST_DOMAINS.length);
  });

  it("applies class and style", () => {
    const { container } = render(QuikturnLogoGrid, {
      props: {
        domains: TEST_DOMAINS,
        class: "my-grid",
        style: { maxWidth: "600px" },
      },
    });
    const grid = container.querySelector(".my-grid");
    expect(grid).not.toBeNull();
    expect((grid as HTMLElement).style.maxWidth).toBe("600px");
  });

  it("does not render link for javascript: href in logos", () => {
    render(QuikturnLogoGrid, {
      props: {
        logos: [
          { domain: "evil.com", href: "javascript:alert(1)" },
          { domain: "good.com", href: "https://good.com" },
        ],
      },
    });
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://good.com");
  });

  it("renders with empty domains array", () => {
    const { container } = render(QuikturnLogoGrid, {
      props: { domains: [] },
    });
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid).toHaveAttribute("role", "region");
  });
});
