import { describe, it, expect, beforeEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { QUIKTURN_CONFIG, provideQuikturnLogos } from "../src/providers";

describe("provideQuikturnLogos", () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it("provides config via QUIKTURN_CONFIG injection token", () => {
    TestBed.configureTestingModule({
      providers: [provideQuikturnLogos({ token: "qt_test" })],
    });

    const config = TestBed.inject(QUIKTURN_CONFIG);
    expect(config).toBeDefined();
    expect(config.token).toBe("qt_test");
  });

  it("provides token and baseUrl", () => {
    TestBed.configureTestingModule({
      providers: [
        provideQuikturnLogos({
          token: "qt_custom",
          baseUrl: "https://custom.example.com",
        }),
      ],
    });

    const config = TestBed.inject(QUIKTURN_CONFIG);
    expect(config.token).toBe("qt_custom");
    expect(config.baseUrl).toBe("https://custom.example.com");
  });

  it("throws when not configured (inject without provider)", () => {
    TestBed.configureTestingModule({});

    // Injecting without provider and without optional flag should throw
    expect(() => TestBed.inject(QUIKTURN_CONFIG)).toThrow();
  });

  it("supports optional injection (inject with { optional: true })", () => {
    TestBed.configureTestingModule({});

    const config = TestBed.inject(QUIKTURN_CONFIG, null, { optional: true });
    expect(config).toBeNull();
  });

  it("multiple calls create independent providers", () => {
    // Test that calling provideQuikturnLogos twice with different configs
    // results in the last one winning (standard Angular DI behavior)
    TestBed.configureTestingModule({
      providers: [
        provideQuikturnLogos({ token: "qt_first" }),
        provideQuikturnLogos({ token: "qt_second" }),
      ],
    });

    const config = TestBed.inject(QUIKTURN_CONFIG);
    expect(config.token).toBe("qt_second");
  });
});
