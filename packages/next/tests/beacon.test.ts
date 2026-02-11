import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireBeacon, _resetBeacon } from "../src/beacon";

describe("fireBeacon", () => {
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
    vi.stubGlobal("location", { href: "https://example.com/page" });
  });

  it("fires a beacon with token and page URL", () => {
    fireBeacon("qt_abc");
    expect(imageSrcs).toHaveLength(1);
    expect(imageSrcs[0]).toContain("_beacon");
    expect(imageSrcs[0]).toContain("token=qt_abc");
    expect(imageSrcs[0]).toContain("page=");
  });

  it("deduplicates by token", () => {
    fireBeacon("qt_abc");
    fireBeacon("qt_abc");
    expect(imageSrcs).toHaveLength(1);
  });

  it("skips empty token", () => {
    fireBeacon("");
    expect(imageSrcs).toHaveLength(0);
  });

  it("skips secret keys (sk_ prefix)", () => {
    fireBeacon("sk_secret");
    expect(imageSrcs).toHaveLength(0);
  });

  it("skips when window is undefined (SSR)", () => {
    const origWindow = globalThis.window;
    // @ts-expect-error - simulating SSR
    delete globalThis.window;
    fireBeacon("qt_abc");
    expect(imageSrcs).toHaveLength(0);
    globalThis.window = origWindow;
  });
});
