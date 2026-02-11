import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireBeacon, _resetBeacon } from "../src/beacon";
import { BASE_URL } from "@quikturn/logos";

describe("fireBeacon", () => {
  let imageSrcs: string[];

  beforeEach(() => {
    _resetBeacon();
    imageSrcs = [];

    // Mock Image constructor to capture src assignments
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

  it("fires beacon with valid publishable token", () => {
    fireBeacon("qt_test123");

    expect(imageSrcs).toHaveLength(1);
    expect(imageSrcs[0]).toContain(`${BASE_URL}/_beacon`);
    expect(imageSrcs[0]).toContain("token=qt_test123");
  });

  it("deduplicates — fires only once per token", () => {
    fireBeacon("qt_dup");
    fireBeacon("qt_dup");

    expect(imageSrcs).toHaveLength(1);
  });

  it("does not fire for sk_ prefix tokens", () => {
    fireBeacon("sk_secret_key");

    expect(imageSrcs).toHaveLength(0);
  });

  it("does not fire when token is empty", () => {
    fireBeacon("");

    expect(imageSrcs).toHaveLength(0);
  });

  it("is SSR-safe (no error when window is undefined)", () => {
    const origWindow = globalThis.window;
    // @ts-expect-error - deliberately removing window for SSR test
    delete globalThis.window;

    try {
      fireBeacon("qt_ssr");
      expect(imageSrcs).toHaveLength(0);
    } finally {
      globalThis.window = origWindow;
    }
  });

  it("_resetBeacon clears dedup set", () => {
    fireBeacon("qt_reset");
    expect(imageSrcs).toHaveLength(1);

    _resetBeacon();
    fireBeacon("qt_reset");
    expect(imageSrcs).toHaveLength(2);
  });
});
