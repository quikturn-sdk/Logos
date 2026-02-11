import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import QuikturnLogo from "../src/lib/QuikturnLogo.svelte";
import LogoWithProvider from "./helpers/LogoWithProvider.svelte";
import { _resetBeacon } from "../src/lib/beacon";
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
    render(QuikturnLogo, {
      props: { domain: "github.com", token: "qt_abc" },
    });
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain(`${BASE_URL}/github.com`);
    expect(img.getAttribute("src")).toContain("token=qt_abc");
  });

  it('defaults alt to "${domain} logo"', () => {
    render(QuikturnLogo, {
      props: { domain: "stripe.com" },
    });
    expect(screen.getByAltText("stripe.com logo")).toBeInTheDocument();
  });

  it("uses custom alt when provided", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", alt: "GitHub" },
    });
    expect(screen.getByAltText("GitHub")).toBeInTheDocument();
  });

  it("wraps in <a> when href is provided", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", href: "https://github.com" },
    });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not wrap in <a> when href is absent", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com" },
    });
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("uses lazy loading by default", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com" },
    });
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });

  it("applies class to wrapper span", () => {
    const { container } = render(QuikturnLogo, {
      props: { domain: "github.com", class: "my-logo" },
    });
    expect(container.querySelector(".my-logo")).not.toBeNull();
  });

  it("applies class to anchor wrapper when href is set", () => {
    const { container } = render(QuikturnLogo, {
      props: { domain: "github.com", class: "logo-link", href: "https://github.com" },
    });
    const link = container.querySelector("a.logo-link");
    expect(link).not.toBeNull();
  });

  it("fires beacon on mount with token", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", token: "qt_beacon" },
    });
    expect(imageSrcs.length).toBeGreaterThan(0);
    expect(imageSrcs[0]).toContain("token=qt_beacon");
  });

  it("uses token from QuikturnProvider context", () => {
    render(LogoWithProvider, {
      props: { token: "qt_ctx_token", domain: "github.com" },
    });
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("token=qt_ctx_token");
  });

  it("uses baseUrl from QuikturnProvider context", () => {
    render(LogoWithProvider, {
      props: { token: "qt_t", baseUrl: "https://custom.api", domain: "github.com" },
    });
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("https://custom.api/github.com");
  });

  it("applies size to logoUrl", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", size: 256 },
    });
    expect(screen.getByRole("img").getAttribute("src")).toContain("size=256");
  });

  it("applies format to logoUrl", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", format: "webp" },
    });
    expect(screen.getByRole("img").getAttribute("src")).toContain("format=webp");
  });

  it("does not render link for javascript: href", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", href: "javascript:alert(1)" },
    });
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("does not render link for data: href", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", href: "data:text/html,<h1>bad</h1>" },
    });
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders link for valid https href", () => {
    render(QuikturnLogo, {
      props: { domain: "github.com", href: "https://github.com" },
    });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com");
  });

  it("fires onerror callback", () => {
    const onerror = vi.fn();
    render(QuikturnLogo, {
      props: { domain: "github.com", onerror },
    });
    const img = screen.getByRole("img");
    img.dispatchEvent(new Event("error"));
    expect(onerror).toHaveBeenCalledTimes(1);
  });

  it("fires onload callback", () => {
    const onload = vi.fn();
    render(QuikturnLogo, {
      props: { domain: "github.com", onload },
    });
    const img = screen.getByRole("img");
    img.dispatchEvent(new Event("load"));
    expect(onload).toHaveBeenCalledTimes(1);
  });

  it("applies style to wrapper when style prop is set", () => {
    const { container } = render(QuikturnLogo, {
      props: { domain: "github.com", style: "opacity: 0.5" },
    });
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe("0.5");
  });
});
