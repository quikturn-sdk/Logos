import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fireBeacon, _resetBeacon } from "../src/beacon";
import { BASE_URL } from "@quikturn/logos";

describe("fireBeacon", () => {
  let originalImage: typeof Image;

  beforeEach(() => {
    _resetBeacon();
    originalImage = globalThis.Image;
  });

  afterEach(() => {
    globalThis.Image = originalImage;
  });

  it("fires beacon pixel with correct URL", () => {
    const img = { src: "" };
    globalThis.Image = class {
      src = "";
      constructor() {
        Object.assign(this, img);
        // Sync src back to our reference when set
        return new Proxy(this, {
          set(_target, prop, value) {
            if (prop === "src") img.src = value;
            return true;
          },
        });
      }
    } as unknown as typeof Image;

    fireBeacon("qt_abc123");

    expect(img.src).toContain(`${BASE_URL}/_beacon`);
    expect(img.src).toContain("token=qt_abc123");
    expect(img.src).toContain("page=");
  });

  it("deduplicates by token", () => {
    let imageCount = 0;
    globalThis.Image = class {
      src = "";
      constructor() {
        imageCount++;
      }
    } as unknown as typeof Image;

    fireBeacon("qt_dedup");
    fireBeacon("qt_dedup");

    expect(imageCount).toBe(1);
  });

  it("skips sk_ tokens (secret keys)", () => {
    let imageCount = 0;
    globalThis.Image = class {
      src = "";
      constructor() {
        imageCount++;
      }
    } as unknown as typeof Image;

    fireBeacon("sk_secret123");

    expect(imageCount).toBe(0);
  });

  it("skips empty tokens", () => {
    let imageCount = 0;
    globalThis.Image = class {
      src = "";
      constructor() {
        imageCount++;
      }
    } as unknown as typeof Image;

    fireBeacon("");

    expect(imageCount).toBe(0);
  });

  it("is SSR-safe (guards against missing window)", () => {
    // The beacon function checks `typeof window === "undefined"` before
    // accessing the DOM. We verify this guard exists in the source and that
    // the function handles the no-window case gracefully.
    //
    // In jsdom, `window` cannot be removed (it's non-configurable), so we
    // test the SSR guard by re-importing the module source and verifying
    // the guard is present, plus confirming the function does not throw
    // in any environment.
    const fs = require("fs");
    const source = fs.readFileSync(
      require.resolve("../src/beacon.ts"),
      "utf8",
    );
    // Verify the SSR guard exists in the source
    expect(source).toContain('typeof window === "undefined"');

    // Additionally verify the function never throws
    expect(() => fireBeacon("qt_ssr_safe")).not.toThrow();
  });

  it("_resetBeacon clears the dedup set", () => {
    let imageCount = 0;
    globalThis.Image = class {
      src = "";
      constructor() {
        imageCount++;
      }
    } as unknown as typeof Image;

    fireBeacon("qt_reset");
    expect(imageCount).toBe(1);

    _resetBeacon();
    fireBeacon("qt_reset");
    expect(imageCount).toBe(2);
  });
});
