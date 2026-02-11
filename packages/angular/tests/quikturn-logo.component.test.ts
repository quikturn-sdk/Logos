import { describe, it, expect, beforeEach, vi } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { QuikturnLogoComponent } from "../src/quikturn-logo.component";
import { provideQuikturnLogos } from "../src/providers";
import { _resetBeacon } from "../src/beacon";
import { BASE_URL } from "@quikturn/logos";

describe("QuikturnLogoComponent", () => {
  let fixture: ComponentFixture<QuikturnLogoComponent>;

  beforeEach(() => {
    _resetBeacon();
    vi.restoreAllMocks();
  });

  describe("with config provider", () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [QuikturnLogoComponent],
        providers: [provideQuikturnLogos({ token: "qt_test" })],
      });
    });

    it("renders img with correct src from logoUrl", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain(`${BASE_URL}/github.com`);
    });

    it("defaults alt to '${domain} logo'", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.alt).toBe("github.com logo");
    });

    it("uses custom alt when provided", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("alt", "GitHub Logo");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.alt).toBe("GitHub Logo");
    });

    it("wraps in <a> when href is provided", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("href", "https://github.com");
      fixture.detectChanges();

      const anchor = fixture.nativeElement.querySelector("a") as HTMLAnchorElement;
      expect(anchor).toBeTruthy();
      expect(anchor.href).toBe("https://github.com/");
      expect(anchor.target).toBe("_blank");
      expect(anchor.rel).toBe("noopener noreferrer");

      const img = anchor.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
    });

    it("does not render <a> when href is absent", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const anchor = fixture.nativeElement.querySelector("a");
      expect(anchor).toBeNull();
    });

    it("uses lazy loading by default", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.getAttribute("loading")).toBe("lazy");
    });

    it("applies class to wrapper span", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("class", "my-logo");
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector("span.my-logo");
      expect(span).toBeTruthy();

      const img = span.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
    });

    it("fires beacon on init with token", () => {
      const images: Array<{ src: string }> = [];
      vi.stubGlobal(
        "Image",
        class MockImage {
          src = "";
          constructor() {
            images.push(this);
          }
        },
      );

      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      expect(images.length).toBeGreaterThanOrEqual(1);
      expect(images[0]!.src).toContain("token=qt_test");
    });

    it("uses token from config provider", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.src).toContain("token=qt_test");
    });

    it("uses baseUrl from config provider", () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [QuikturnLogoComponent],
        providers: [
          provideQuikturnLogos({
            token: "qt_base",
            baseUrl: "https://custom.logos.io",
          }),
        ],
      });

      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.src).toContain("https://custom.logos.io/github.com");
    });

    it("applies size to logoUrl", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("size", 256);
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.src).toContain("size=256");
    });

    it("applies format to logoUrl", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("format", "webp");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.src).toContain("format=webp");
    });

    it("does not render link for javascript: href", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("href", "javascript:alert(1)");
      fixture.detectChanges();

      const anchor = fixture.nativeElement.querySelector("a");
      expect(anchor).toBeNull();
      // Image should still render (just not wrapped in a link)
      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
    });

    it("does not render link for data: href", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("href", "data:text/html,<h1>hello</h1>");
      fixture.detectChanges();

      const anchor = fixture.nativeElement.querySelector("a");
      expect(anchor).toBeNull();
      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
    });

    it("renders link for valid https href", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.componentRef.setInput("href", "https://example.com");
      fixture.detectChanges();

      const anchor = fixture.nativeElement.querySelector("a") as HTMLAnchorElement;
      expect(anchor).toBeTruthy();
      expect(anchor.href).toContain("https://example.com");
    });

    it("emits imgError when image fails to load", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const emitted: Event[] = [];
      fixture.componentInstance.imgError.subscribe((e: Event) => emitted.push(e));

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      const errorEvent = new Event("error");
      img.dispatchEvent(errorEvent);

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBeInstanceOf(Event);
    });

    it("emits imgLoad when image loads successfully", () => {
      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const emitted: Event[] = [];
      fixture.componentInstance.imgLoad.subscribe((e: Event) => emitted.push(e));

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      const loadEvent = new Event("load");
      img.dispatchEvent(loadEvent);

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBeInstanceOf(Event);
    });

    it("renders with empty/undefined token", () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [QuikturnLogoComponent],
        providers: [provideQuikturnLogos({ token: "" })],
      });

      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain(`${BASE_URL}/github.com`);
      // Should not include token= when token is empty
      expect(img.src).not.toContain("token=");
    });
  });

  describe("without config provider", () => {
    it("works without provider (optional inject)", () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [QuikturnLogoComponent],
      });

      fixture = TestBed.createComponent(QuikturnLogoComponent);
      fixture.componentRef.setInput("domain", "github.com");
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain(`${BASE_URL}/github.com`);
    });
  });
});
