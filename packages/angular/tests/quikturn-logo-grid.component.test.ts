import { describe, it, expect, beforeEach, vi } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { QuikturnLogoGridComponent } from "../src/quikturn-logo-grid.component";
import { provideQuikturnLogos } from "../src/providers";
import { _resetBeacon } from "../src/beacon";
import { BASE_URL } from "@quikturn/logos";

describe("QuikturnLogoGridComponent", () => {
  let fixture: ComponentFixture<QuikturnLogoGridComponent>;

  beforeEach(() => {
    _resetBeacon();
    vi.restoreAllMocks();
  });

  describe("with config provider", () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [QuikturnLogoGridComponent],
        providers: [provideQuikturnLogos({ token: "qt_grid" })],
      });
    });

    it("renders images for each domain", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", [
        "github.com",
        "gitlab.com",
        "bitbucket.org",
      ]);
      fixture.detectChanges();

      const images = fixture.nativeElement.querySelectorAll("img");
      expect(images.length).toBe(3);
    });

    it("uses grid layout (display: grid)", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
      expect(gridDiv).toBeTruthy();
      expect(gridDiv.style.display).toBe("grid");
    });

    it("applies columns as grid-template-columns", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.componentRef.setInput("columns", 3);
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
      expect(gridDiv.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    });

    it("defaults to 4 columns", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
      expect(gridDiv.style.gridTemplateColumns).toBe("repeat(4, 1fr)");
    });

    it("applies gap", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.componentRef.setInput("gap", 16);
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
      expect(gridDiv.style.gap).toBe("16px");
    });

    it("has role='region' with aria-label", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.componentRef.setInput("ariaLabel", "Partner logos");
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
      expect(gridDiv).toBeTruthy();
      expect(gridDiv.getAttribute("aria-label")).toBe("Partner logos");
    });

    it("uses logoUrl for each image src", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com", "gitlab.com"]);
      fixture.detectChanges();

      const images = fixture.nativeElement.querySelectorAll("img") as NodeListOf<HTMLImageElement>;
      expect(images[0]!.src).toContain(`${BASE_URL}/github.com`);
      expect(images[1]!.src).toContain(`${BASE_URL}/gitlab.com`);
    });

    it("fires beacon on init", () => {
      const beaconImages: Array<{ src: string }> = [];
      vi.stubGlobal(
        "Image",
        class MockImage {
          src = "";
          constructor() {
            beaconImages.push(this);
          }
        },
      );

      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.detectChanges();

      expect(beaconImages.length).toBeGreaterThanOrEqual(1);
      expect(beaconImages[0]!.src).toContain("token=qt_grid");
    });

    it("uses token from config provider", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector("img") as HTMLImageElement;
      expect(img.src).toContain("token=qt_grid");
    });

    it("applies class to grid container", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.componentRef.setInput("class", "logo-grid");
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector(".logo-grid") as HTMLElement;
      expect(gridDiv).toBeTruthy();
      expect(gridDiv.getAttribute("role")).toBe("region");
    });

    it("default aria-label is 'Company logos'", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", ["github.com"]);
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
      expect(gridDiv.getAttribute("aria-label")).toBe("Company logos");
    });

    it("does not render link for javascript: href in logos", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("logos", [
        { domain: "github.com", href: "javascript:alert(1)" },
        { domain: "gitlab.com", href: "https://gitlab.com" },
      ]);
      fixture.detectChanges();

      const anchors = fixture.nativeElement.querySelectorAll("a");
      // Only the valid href should produce an anchor
      expect(anchors.length).toBe(1);
      expect((anchors[0] as HTMLAnchorElement).href).toContain("https://gitlab.com");

      // Both images should still render
      const images = fixture.nativeElement.querySelectorAll("img");
      expect(images.length).toBe(2);
    });

    it("renders with empty domains array", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("domains", []);
      fixture.detectChanges();

      const images = fixture.nativeElement.querySelectorAll("img");
      expect(images.length).toBe(0);

      // Grid container should still render
      const gridDiv = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
      expect(gridDiv).toBeTruthy();
    });

    it("renders with logos input instead of domains", () => {
      fixture = TestBed.createComponent(QuikturnLogoGridComponent);
      fixture.componentRef.setInput("logos", [
        { domain: "github.com", alt: "GitHub" },
        { domain: "gitlab.com", size: 256 },
      ]);
      fixture.detectChanges();

      const images = fixture.nativeElement.querySelectorAll("img") as NodeListOf<HTMLImageElement>;
      expect(images.length).toBe(2);
      expect(images[0]!.alt).toBe("GitHub");
      expect(images[0]!.src).toContain(`${BASE_URL}/github.com`);
      expect(images[1]!.alt).toBe("gitlab.com logo");
      expect(images[1]!.src).toContain("size=256");
    });
  });
});
