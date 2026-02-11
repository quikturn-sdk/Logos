import { describe, it, expect, beforeEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { injectLogoUrl } from "../src/inject-logo-url";
import { provideQuikturnLogos } from "../src/providers";
import { BASE_URL } from "@quikturn/logos";

describe("injectLogoUrl", () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it("returns a computed URL for a domain", () => {
    TestBed.configureTestingModule({
      providers: [provideQuikturnLogos({ token: "qt_test" })],
    });

    const url = TestBed.runInInjectionContext(() =>
      injectLogoUrl({ domain: () => "github.com" }),
    );

    expect(url()).toContain(`${BASE_URL}/github.com`);
  });

  it("includes token from config in the URL", () => {
    TestBed.configureTestingModule({
      providers: [provideQuikturnLogos({ token: "qt_mytoken" })],
    });

    const url = TestBed.runInInjectionContext(() =>
      injectLogoUrl({ domain: () => "example.com" }),
    );

    expect(url()).toContain("token=qt_mytoken");
  });

  it("applies size, format, greyscale, and theme options", () => {
    TestBed.configureTestingModule({
      providers: [provideQuikturnLogos({ token: "qt_opts" })],
    });

    const url = TestBed.runInInjectionContext(() =>
      injectLogoUrl({
        domain: () => "example.com",
        size: () => 256,
        format: () => "webp",
        greyscale: () => true,
        theme: () => "dark",
      }),
    );

    const result = url();
    expect(result).toContain("size=256");
    expect(result).toContain("format=webp");
    expect(result).toContain("greyscale=1");
    expect(result).toContain("theme=dark");
  });

  it("uses baseUrl from config", () => {
    TestBed.configureTestingModule({
      providers: [
        provideQuikturnLogos({
          token: "qt_base",
          baseUrl: "https://custom.logos.io",
        }),
      ],
    });

    const url = TestBed.runInInjectionContext(() =>
      injectLogoUrl({ domain: () => "example.com" }),
    );

    expect(url()).toContain("https://custom.logos.io/example.com");
  });

  it("token option overrides config token", () => {
    TestBed.configureTestingModule({
      providers: [provideQuikturnLogos({ token: "qt_config" })],
    });

    const url = TestBed.runInInjectionContext(() =>
      injectLogoUrl({
        domain: () => "example.com",
        token: () => "qt_override",
      }),
    );

    expect(url()).toContain("token=qt_override");
    expect(url()).not.toContain("token=qt_config");
  });

  it("works without config (no provider, optional inject)", () => {
    TestBed.configureTestingModule({});

    const url = TestBed.runInInjectionContext(() =>
      injectLogoUrl({
        domain: () => "example.com",
        token: () => "qt_standalone",
      }),
    );

    expect(url()).toContain(`${BASE_URL}/example.com`);
    expect(url()).toContain("token=qt_standalone");
  });

  it("throws outside injection context (assertInInjectionContext)", () => {
    expect(() => {
      injectLogoUrl({ domain: () => "example.com" });
    }).toThrow();
  });
});
