import { describe, it, expect, beforeEach, vi } from "vitest";
import { _resetBeacon } from "../../src/internal/beacon";
import { BASE_URL } from "../../src/constants";

// ---------------------------------------------------------------------------
// Phase 7B — <quikturn-logo> Web Component Tests
// ---------------------------------------------------------------------------

// Track Image.src for beacon assertions
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
      set src(val: string) {
        this._src = val;
        imageSrcs.push(val);
      }
    },
  );
});

// Dynamically import to ensure customElements.define runs in jsdom
async function getQuikturnLogo() {
  // Clear module cache so each test gets a fresh import
  const mod = await import("../../src/element/index");
  return mod.QuikturnLogo;
}

function createElement(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("quikturn-logo");
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val);
  }
  return el;
}

function appendAndGet(attrs: Record<string, string> = {}): HTMLElement {
  const el = createElement(attrs);
  document.body.appendChild(el);
  return el;
}

describe("Phase 7B: <quikturn-logo> Web Component", () => {
  // E.1 - QuikturnLogo is registered as quikturn-logo custom element
  it("E.1 - registered as quikturn-logo custom element", async () => {
    await getQuikturnLogo();
    expect(customElements.get("quikturn-logo")).toBeDefined();
  });

  // E.2 - Creates shadow root on construction
  it("E.2 - creates shadow root on construction", async () => {
    await getQuikturnLogo();
    const el = createElement();
    expect(el.shadowRoot).not.toBeNull();
  });

  // E.3 - Renders <img> inside shadow DOM when domain is set
  it("E.3 - renders <img> when domain is set", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const img = el.shadowRoot!.querySelector("img");
    expect(img).not.toBeNull();
    document.body.removeChild(el);
  });

  // E.4 - <img> src matches logoUrl(domain, { token }) output
  it("E.4 - img src matches logoUrl output", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", token: "qt_abc" });
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.src).toContain(`${BASE_URL}/github.com`);
    expect(img.src).toContain("token=qt_abc");
    document.body.removeChild(el);
  });

  // E.5 - <img> has loading="lazy" attribute
  it("E.5 - img has loading=lazy", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.loading).toBe("lazy");
    document.body.removeChild(el);
  });

  // E.6 - Renders attribution link with text "Powered by Quikturn"
  it("E.6 - renders attribution link with correct text", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const link = el.shadowRoot!.querySelector("a")!;
    expect(link.textContent).toBe("Powered by Quikturn");
    document.body.removeChild(el);
  });

  // E.7 - Attribution link href is https://getquikturn.io?ref=<domain>
  it("E.7 - attribution link href includes ref=domain", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const link = el.shadowRoot!.querySelector("a")!;
    expect(link.href).toBe("https://getquikturn.io/?ref=github.com");
    document.body.removeChild(el);
  });

  // E.8 - Attribution link opens in new tab (target="_blank")
  it("E.8 - attribution link opens in new tab", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const link = el.shadowRoot!.querySelector("a")!;
    expect(link.target).toBe("_blank");
    document.body.removeChild(el);
  });

  // E.9 - Attribution elements have no part attribute
  it("E.9 - no part attributes on attribution elements", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const allElements = el.shadowRoot!.querySelectorAll("*");
    for (const child of allElements) {
      expect(child.getAttribute("part")).toBeNull();
    }
    document.body.removeChild(el);
  });

  // E.10 - No <img> rendered when domain attribute is absent
  it("E.10 - no img when domain is absent", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({});
    const img = el.shadowRoot!.querySelector("img");
    expect(img).toBeNull();
    document.body.removeChild(el);
  });

  // E.11 - Setting domain attribute after creation triggers render
  it("E.11 - setting domain after creation triggers render", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({});
    expect(el.shadowRoot!.querySelector("img")).toBeNull();

    el.setAttribute("domain", "example.com");
    const img = el.shadowRoot!.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.src).toContain("example.com");
    document.body.removeChild(el);
  });

  // E.12 - Changing token attribute updates <img> src
  it("E.12 - changing token updates img src", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", token: "qt_old" });
    const img1 = el.shadowRoot!.querySelector("img")!;
    expect(img1.src).toContain("token=qt_old");

    el.setAttribute("token", "qt_new");
    const img2 = el.shadowRoot!.querySelector("img")!;
    expect(img2.src).toContain("token=qt_new");
    document.body.removeChild(el);
  });

  // E.13 - size attribute is passed to logoUrl()
  it("E.13 - size attribute passed to logoUrl", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", size: "256" });
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.src).toContain("size=256");
    document.body.removeChild(el);
  });

  // E.14 - format attribute is passed to logoUrl()
  it("E.14 - format attribute passed to logoUrl", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", format: "webp" });
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.src).toContain("format=webp");
    document.body.removeChild(el);
  });

  // E.15 - greyscale attribute (present = true) passed to logoUrl()
  it("E.15 - greyscale attribute passed to logoUrl", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", greyscale: "" });
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.src).toContain("greyscale=1");
    document.body.removeChild(el);
  });

  // E.16 - theme attribute passed to logoUrl()
  it("E.16 - theme attribute passed to logoUrl", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", theme: "dark" });
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.src).toContain("theme=dark");
    document.body.removeChild(el);
  });

  // E.26 - variant attribute passed to logoUrl()
  it("E.26 - variant attribute passed to logoUrl", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", variant: "icon" });
    const img = el.shadowRoot!.querySelector("img")!;
    expect(img.src).toContain("variant=icon");
    document.body.removeChild(el);
  });

  // E.17 - Shadow DOM contains <style> with !important rules
  it("E.17 - shadow DOM contains style with !important", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const style = el.shadowRoot!.querySelector("style")!;
    expect(style.textContent).toContain("!important");
    document.body.removeChild(el);
  });

  // E.18 - Attribution text includes !important display rule
  it("E.18 - attribution styles include !important display", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com" });
    const style = el.shadowRoot!.querySelector("style")!;
    expect(style.textContent).toContain("display: block !important");
    document.body.removeChild(el);
  });

  // E.19 - Fires beacon on connectedCallback
  it("E.19 - fires beacon on connectedCallback", async () => {
    await getQuikturnLogo();
    appendAndGet({ domain: "github.com", token: "qt_beacon" });
    expect(imageSrcs).toHaveLength(1);
    expect(imageSrcs[0]).toContain("token=qt_beacon");
  });

  // E.20 - Does NOT fire beacon when domain is absent
  it("E.20 - no beacon when domain is absent", async () => {
    await getQuikturnLogo();
    appendAndGet({ token: "qt_nodom" });
    expect(imageSrcs).toHaveLength(0);
  });

  // E.21 - Does NOT fire beacon for sk_ tokens
  it("E.21 - no beacon for sk_ tokens", async () => {
    await getQuikturnLogo();
    appendAndGet({ domain: "github.com", token: "sk_secret" });
    expect(imageSrcs).toHaveLength(0);
  });

  // E.22 - Beacon fires only once even after attribute changes
  it("E.22 - beacon fires only once after attribute changes", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", token: "qt_once" });
    expect(imageSrcs).toHaveLength(1);

    el.setAttribute("size", "256");
    el.setAttribute("format", "webp");
    expect(imageSrcs).toHaveLength(1);
    document.body.removeChild(el);
  });

  // E.23 - Multiple instances with same token fire beacon only once (dedup)
  it("E.23 - dedup across multiple instances with same token", async () => {
    await getQuikturnLogo();
    const el1 = appendAndGet({ domain: "a.com", token: "qt_shared" });
    const el2 = appendAndGet({ domain: "b.com", token: "qt_shared" });

    // fireBeacon deduplicates by token
    expect(imageSrcs).toHaveLength(1);
    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });

  // E.24 - Removing and re-adding element does not double-fire beacon
  it("E.24 - remove and re-add does not double-fire", async () => {
    await getQuikturnLogo();
    const el = appendAndGet({ domain: "github.com", token: "qt_readd" });
    expect(imageSrcs).toHaveLength(1);

    document.body.removeChild(el);
    document.body.appendChild(el);

    // _beaconFired flag prevents re-fire AND token dedup in beacon module
    expect(imageSrcs).toHaveLength(1);
  });

  // E.25 - observedAttributes includes all 7 attribute names
  it("E.25 - observedAttributes includes all 7 names", async () => {
    const QuikturnLogo = await getQuikturnLogo();
    const attrs = QuikturnLogo.observedAttributes;
    expect(attrs).toContain("domain");
    expect(attrs).toContain("token");
    expect(attrs).toContain("size");
    expect(attrs).toContain("format");
    expect(attrs).toContain("greyscale");
    expect(attrs).toContain("theme");
    expect(attrs).toContain("variant");
    expect(attrs).toHaveLength(7);
  });
});
