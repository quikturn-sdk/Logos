import { describe, it, expect, beforeEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { LogoUrlPipe } from "../src/logo-url.pipe";
import { provideQuikturnLogos } from "../src/providers";
import { BASE_URL } from "@quikturn/logos";

describe("LogoUrlPipe", () => {
  let pipe: LogoUrlPipe;

  describe("with config provider", () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideQuikturnLogos({ token: "qt_pipe" })],
      });
      pipe = TestBed.runInInjectionContext(() => new LogoUrlPipe());
    });

    it("transforms domain to logo URL", () => {
      const result = pipe.transform("github.com");
      expect(result).toContain(`${BASE_URL}/github.com`);
    });

    it("includes token from config", () => {
      const result = pipe.transform("example.com");
      expect(result).toContain("token=qt_pipe");
    });

    it("applies options (size, format)", () => {
      const result = pipe.transform("example.com", {
        size: 512,
        format: "jpeg",
      });
      expect(result).toContain("size=512");
      expect(result).toContain("format=jpeg");
    });

    it("uses custom token from options (overrides config)", () => {
      const result = pipe.transform("example.com", {
        token: "qt_custom",
      });
      expect(result).toContain("token=qt_custom");
      expect(result).not.toContain("token=qt_pipe");
    });
  });

  describe("without config provider", () => {
    it("works without config provider when token passed in options", () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const pipeNoConfig = TestBed.runInInjectionContext(
        () => new LogoUrlPipe(),
      );

      const result = pipeNoConfig.transform("example.com", {
        token: "qt_inline",
      });
      expect(result).toContain(`${BASE_URL}/example.com`);
      expect(result).toContain("token=qt_inline");
    });
  });
});
