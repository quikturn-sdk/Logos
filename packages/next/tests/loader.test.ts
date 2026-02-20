import { describe, it, expect } from "vitest";
import { quikturnImageLoader, createQuikturnImageLoader } from "../src/loader";

describe("quikturnImageLoader", () => {
  it("generates a valid logo URL from domain and width", () => {
    const url = quikturnImageLoader({ src: "github.com", width: 256 });

    expect(url).toContain("github.com");
    expect(url).toContain("size=256");
    expect(url).not.toContain("autoScrape");
  });

  it("uses default width (128) when width matches default", () => {
    const url = quikturnImageLoader({ src: "github.com", width: 128 });

    // url-builder omits size= when it equals DEFAULT_WIDTH (128)
    expect(url).not.toContain("size=");
    expect(url).toContain("github.com");
    expect(url).not.toContain("autoScrape");
  });
});

describe("createQuikturnImageLoader", () => {
  it("includes token when provided", () => {
    const loader = createQuikturnImageLoader({ token: "qt_abc" });
    const url = loader({ src: "github.com", width: 128 });

    expect(url).toContain("token=qt_abc");
  });

  it("includes format option", () => {
    const loader = createQuikturnImageLoader({ format: "webp" });
    const url = loader({ src: "github.com", width: 128 });

    expect(url).toContain("format=webp");
  });

  it("includes greyscale option", () => {
    const loader = createQuikturnImageLoader({ greyscale: true });
    const url = loader({ src: "github.com", width: 128 });

    expect(url).toContain("greyscale=1");
  });

  it("includes theme option", () => {
    const loader = createQuikturnImageLoader({ theme: "dark" });
    const url = loader({ src: "github.com", width: 128 });

    expect(url).toContain("theme=dark");
  });

  it("includes variant option", () => {
    const loader = createQuikturnImageLoader({ variant: "icon" });
    const url = loader({ src: "github.com", width: 128 });

    expect(url).toContain("variant=icon");
  });
});
