import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import QuikturnLogoCarousel from "../src/lib/QuikturnLogoCarousel.svelte";
import CarouselWithProvider from "./helpers/CarouselWithProvider.svelte";
import CarouselWithRenderItem from "./helpers/CarouselWithRenderItem.svelte";
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

const TEST_DOMAINS = ["github.com", "stripe.com", "vercel.com"];

describe("QuikturnLogoCarousel", () => {
  it("renders images for each domain string", () => {
    render(QuikturnLogoCarousel, { props: { domains: TEST_DOMAINS } });
    const images = screen.getAllByRole("img");
    // At minimum the first copy has images; copies multiply them
    expect(images.length).toBeGreaterThanOrEqual(TEST_DOMAINS.length);
  });

  it("renders images for LogoConfig objects", () => {
    render(QuikturnLogoCarousel, {
      props: {
        logos: [
          { domain: "github.com", alt: "GitHub" },
          { domain: "stripe.com", alt: "Stripe" },
        ],
      },
    });
    expect(screen.getAllByAltText("GitHub").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByAltText("Stripe").length).toBeGreaterThanOrEqual(1);
  });

  it("image srcs use logoUrl with correct params", () => {
    render(QuikturnLogoCarousel, {
      props: {
        domains: ["github.com"],
        token: "qt_test",
        logoSize: 256,
      },
    });
    const img = screen.getAllByRole("img")[0] as HTMLImageElement;
    expect(img.src).toContain(`${BASE_URL}/github.com`);
    expect(img.src).toContain("token=qt_test");
    expect(img.src).toContain("size=256");
  });

  it('has role="region" with aria-label', () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, ariaLabel: "Partner logos" },
    });
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-label",
      "Partner logos",
    );
  });

  it('defaults aria-label to "Company logos"', () => {
    render(QuikturnLogoCarousel, { props: { domains: TEST_DOMAINS } });
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-label",
      "Company logos",
    );
  });

  it("creates multiple copies for seamless loop", () => {
    render(QuikturnLogoCarousel, { props: { domains: TEST_DOMAINS } });
    const lists = screen.getAllByRole("list", { hidden: true });
    expect(lists.length).toBeGreaterThanOrEqual(2);
  });

  it("first copy is not aria-hidden, subsequent copies are", () => {
    render(QuikturnLogoCarousel, { props: { domains: TEST_DOMAINS } });
    const lists = screen.getAllByRole("list", { hidden: true });
    expect(lists[0]).not.toHaveAttribute("aria-hidden");
    if (lists.length > 1) {
      expect(lists[1]).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("renders fade overlays when fadeOut=true", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, fadeOut: true },
    });
    const overlays = screen.getAllByTestId("fade-overlay");
    expect(overlays).toHaveLength(2);
  });

  it("no fade overlays when fadeOut=false", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, fadeOut: false },
    });
    expect(screen.queryAllByTestId("fade-overlay")).toHaveLength(0);
  });

  it("applies class to root element", () => {
    const { container } = render(QuikturnLogoCarousel, {
      props: {
        domains: TEST_DOMAINS,
        class: "my-carousel",
      },
    });
    const root = container.querySelector(".my-carousel");
    expect(root).not.toBeNull();
  });

  it("fires beacon on mount", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, token: "qt_carousel" },
    });
    expect(imageSrcs.length).toBeGreaterThan(0);
    expect(imageSrcs[0]).toContain("token=qt_carousel");
  });

  it("uses token from context", () => {
    render(CarouselWithProvider, {
      props: { token: "qt_ctx", domains: TEST_DOMAINS },
    });
    const img = screen.getAllByRole("img")[0] as HTMLImageElement;
    expect(img.src).toContain("token=qt_ctx");
  });

  it("calls renderItem when provided", () => {
    const onRenderItem = vi.fn();
    render(CarouselWithRenderItem, {
      props: { domains: TEST_DOMAINS, onRenderItem },
    });
    expect(onRenderItem).toHaveBeenCalled();
    expect(onRenderItem.mock.calls[0]![0]).toHaveProperty("domain", "github.com");
    expect(onRenderItem.mock.calls[0]![0]).toHaveProperty("url");
  });

  it("applies width to container", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, width: 600 },
    });
    const region = screen.getByRole("region") as HTMLElement;
    expect(region.style.width).toBe("600px");
  });

  it("supports string width", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, width: "80%" },
    });
    const region = screen.getByRole("region") as HTMLElement;
    expect(region.style.width).toBe("80%");
  });

  it("links wrap images when href is provided", () => {
    render(QuikturnLogoCarousel, {
      props: {
        logos: [{ domain: "github.com", href: "https://github.com" }],
      },
    });
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "https://github.com");
  });

  it("renders with direction='right'", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, direction: "right" },
    });
    expect(screen.getByRole("region")).toBeInTheDocument();
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(TEST_DOMAINS.length);
  });

  it("renders with direction='up'", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: TEST_DOMAINS, direction: "up" },
    });
    expect(screen.getByRole("region")).toBeInTheDocument();
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(TEST_DOMAINS.length);
  });

  it("renders with empty domains array", () => {
    render(QuikturnLogoCarousel, {
      props: { domains: [] },
    });
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("applies logoVariant to image srcs", () => {
    render(QuikturnLogoCarousel, {
      props: {
        domains: ["github.com"],
        logoVariant: "icon",
      },
    });
    const img = screen.getAllByRole("img")[0] as HTMLImageElement;
    expect(img.src).toContain("variant=icon");
  });

  it("does not render link for javascript: href", () => {
    render(QuikturnLogoCarousel, {
      props: {
        logos: [{ domain: "evil.com", href: "javascript:alert(1)" }],
      },
    });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getAllByRole("img").length).toBeGreaterThanOrEqual(1);
  });
});
