import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { logoUrl } from "@quikturn/logos";
import type { SupportedOutputFormat, ThemeOption } from "@quikturn/logos";
import { QUIKTURN_CONFIG } from "./providers";
import { fireBeacon } from "./beacon";
import type { LogoConfig, ResolvedLogo } from "./types";

/** Animation configuration constants. */
const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2,
} as const;

/**
 * Standalone component that renders an auto-scrolling carousel of Quikturn logos.
 *
 * Supports both `domains` (string[]) and `logos` (LogoConfig[]) inputs.
 * Creates multiple `<ul>` copies for seamless infinite scroll animation.
 * Fires an attribution beacon on initialization.
 */
@Component({
  selector: "quikturn-logo-carousel",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #container
      role="region"
      [attr.aria-label]="ariaLabel()"
      [class]="cssClass()"
      [style.position]="'relative'"
      [style.overflow]="'hidden'"
      [style.width]="isVertical() ? undefined : cssWidth()"
      [style.height]="isVertical() ? '100%' : undefined"
    >
      @if (fadeOut()) {
        @if (isVertical()) {
          <div
            aria-hidden="true"
            data-testid="fade-overlay"
            [style.position]="'absolute'"
            [style.pointer-events]="'none'"
            [style.z-index]="1"
            [style.top]="'0'"
            [style.left]="'0'"
            [style.right]="'0'"
            [style.height]="'clamp(24px, 8%, 120px)'"
            [style.background]="
              'linear-gradient(to bottom, ' +
              fadeOutColor() +
              ' 0%, transparent 100%)'
            "
          ></div>
          <div
            aria-hidden="true"
            data-testid="fade-overlay"
            [style.position]="'absolute'"
            [style.pointer-events]="'none'"
            [style.z-index]="1"
            [style.bottom]="'0'"
            [style.left]="'0'"
            [style.right]="'0'"
            [style.height]="'clamp(24px, 8%, 120px)'"
            [style.background]="
              'linear-gradient(to top, ' +
              fadeOutColor() +
              ' 0%, transparent 100%)'
            "
          ></div>
        } @else {
          <div
            aria-hidden="true"
            data-testid="fade-overlay"
            [style.position]="'absolute'"
            [style.pointer-events]="'none'"
            [style.z-index]="1"
            [style.top]="'0'"
            [style.bottom]="'0'"
            [style.left]="'0'"
            [style.width]="'clamp(24px, 8%, 120px)'"
            [style.background]="
              'linear-gradient(to right, ' +
              fadeOutColor() +
              ' 0%, transparent 100%)'
            "
          ></div>
          <div
            aria-hidden="true"
            data-testid="fade-overlay"
            [style.position]="'absolute'"
            [style.pointer-events]="'none'"
            [style.z-index]="1"
            [style.top]="'0'"
            [style.bottom]="'0'"
            [style.right]="'0'"
            [style.width]="'clamp(24px, 8%, 120px)'"
            [style.background]="
              'linear-gradient(to left, ' +
              fadeOutColor() +
              ' 0%, transparent 100%)'
            "
          ></div>
        }
      }

      <div
        #track
        [style.display]="'flex'"
        [style.flex-direction]="isVertical() ? 'column' : 'row'"
        [style.width]="isVertical() ? '100%' : 'max-content'"
        [style.will-change]="'transform'"
        [style.user-select]="'none'"
        [style.position]="'relative'"
        [style.z-index]="'0'"
        (mouseenter)="handleMouseEnter()"
        (mouseleave)="handleMouseLeave()"
      >
        @for (ci of copyIndices(); track ci) {
          <ul
            role="list"
            [attr.aria-hidden]="ci > 0 ? 'true' : null"
            [style.display]="'flex'"
            [style.flex-direction]="isVertical() ? 'column' : 'row'"
            [style.align-items]="'center'"
            [style.list-style]="'none'"
            [style.margin]="'0'"
            [style.padding]="'0'"
          >
            @for (logo of resolvedLogos(); track logo.domain + '-' + ci + '-' + $index) {
              <li
                role="listitem"
                [style.flex]="'none'"
                [style.margin-right.px]="isVertical() ? 0 : gap()"
                [style.margin-bottom.px]="isVertical() ? gap() : 0"
              >
                @if (logo.href) {
                  <a
                    [href]="logo.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    [attr.aria-label]="logo.alt"
                    style="display: inline-flex; align-items: center; text-decoration: none"
                  >
                    <img
                      [src]="logo.url"
                      [alt]="logo.alt"
                      loading="lazy"
                      decoding="async"
                      [attr.draggable]="false"
                      [style.height.px]="logoHeight()"
                      style="width: auto; display: block; object-fit: contain"
                    />
                  </a>
                } @else {
                  <span style="display: inline-flex; align-items: center">
                    <img
                      [src]="logo.url"
                      [alt]="logo.alt"
                      loading="lazy"
                      decoding="async"
                      [attr.draggable]="false"
                      [style.height.px]="logoHeight()"
                      style="width: auto; display: block; object-fit: contain"
                    />
                  </span>
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class QuikturnLogoCarouselComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private readonly config = inject(QUIKTURN_CONFIG, { optional: true });

  // ---------------------------------------------------------------------------
  // Signal inputs
  // ---------------------------------------------------------------------------

  /** Array of domain strings to display logos for. */
  domains = input<string[] | undefined>(undefined);

  /** Array of LogoConfig objects for more control over each logo. */
  logos = input<LogoConfig[] | undefined>(undefined);

  /** Publishable token for the Quikturn API. Overrides provider token. */
  token = input<string | undefined>(undefined);

  /** Custom base URL for the logo API. */
  baseUrl = input<string | undefined>(undefined);

  /** Scroll speed in pixels per second. */
  speed = input<number>(120);

  /** Scroll direction. */
  direction = input<"left" | "right" | "up" | "down">("left");

  /** Whether to pause scrolling on hover. */
  pauseOnHover = input<boolean | undefined>(undefined);

  /** Speed when hovered (0 = pause). */
  hoverSpeed = input<number | undefined>(undefined);

  /** Height of each logo image in pixels. */
  logoHeight = input<number>(28);

  /** Gap between logos in pixels. */
  gap = input<number>(32);

  /** Width of the carousel container. */
  width = input<number | string>("100%");

  /** Whether to show fade overlays at the edges. */
  fadeOut = input<boolean>(false);

  /** Color for the fade gradient. */
  fadeOutColor = input<string>("#ffffff");

  /** Whether to scale logos on hover. */
  scaleOnHover = input<boolean>(false);

  /** Default logo size option. */
  logoSize = input<number | undefined>(undefined);

  /** Default logo format option. */
  logoFormat = input<string | undefined>(undefined);

  /** Default greyscale option. */
  logoGreyscale = input<boolean | undefined>(undefined);

  /** Default theme option. */
  logoTheme = input<string | undefined>(undefined);

  /** CSS class to apply to the root element. */
  cssClass = input<string | undefined>(undefined, { alias: "class" });

  /** Accessible label for the carousel region. */
  ariaLabel = input<string>("Company logos");

  // ---------------------------------------------------------------------------
  // ViewChild refs
  // ---------------------------------------------------------------------------

  @ViewChild("container") containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild("track") trackRef!: ElementRef<HTMLDivElement>;

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  protected seqWidth = signal(0);
  protected seqHeight = signal(0);
  protected copyCount = signal<number>(ANIMATION_CONFIG.MIN_COPIES);
  protected isHovered = signal(false);

  private animationFrameId: number | null = null;
  private currentVelocity = 0;
  private offset = 0;
  private resizeObserver: ResizeObserver | null = null;
  private handleResize = (): void => this.updateDimensions();

  // ---------------------------------------------------------------------------
  // Computed signals
  // ---------------------------------------------------------------------------

  /** Effective token: prop > provider > empty. */
  protected effectiveToken = computed(
    () => this.token() ?? this.config?.token ?? "",
  );

  /** Effective base URL: prop > provider > undefined. */
  protected effectiveBaseUrl = computed(
    () => this.baseUrl() ?? this.config?.baseUrl,
  );

  /** Whether the carousel scrolls vertically. */
  protected isVertical = computed(
    () => this.direction() === "up" || this.direction() === "down",
  );

  /** Resolve domains/logos into ResolvedLogo objects with built URLs. */
  protected resolvedLogos = computed<ResolvedLogo[]>(() => {
    const items: LogoConfig[] =
      this.logos() ?? (this.domains() ?? []).map((d) => ({ domain: d }));
    return items.map((item) => ({
      domain: item.domain,
      alt: item.alt ?? `${item.domain} logo`,
      href: item.href,
      url: logoUrl(item.domain, {
        token: this.effectiveToken() || undefined,
        size: item.size ?? this.logoSize(),
        format: (item.format ?? this.logoFormat()) as SupportedOutputFormat | undefined,
        greyscale: item.greyscale ?? this.logoGreyscale(),
        theme: (item.theme ?? this.logoTheme()) as ThemeOption | undefined,
        baseUrl: this.effectiveBaseUrl(),
      }),
    }));
  });

  /** CSS width string for the container. */
  protected cssWidth = computed(() => {
    const w = this.width();
    return typeof w === "number" ? `${w}px` : (w ?? "100%");
  });

  /** Array of copy indices for the template loop. */
  protected copyIndices = computed(() =>
    Array.from({ length: this.copyCount() }, (_, i) => i),
  );

  /** Target velocity for the animation. */
  protected targetVelocity = computed(() => {
    const mag = Math.abs(this.speed());
    const dirMul = this.isVertical()
      ? this.direction() === "up"
        ? 1
        : -1
      : this.direction() === "left"
        ? 1
        : -1;
    const signMul = this.speed() < 0 ? -1 : 1;
    return mag * dirMul * signMul;
  });

  /** Effective hover speed. */
  protected effectiveHoverSpeed = computed(() => {
    const hs = this.hoverSpeed();
    if (hs !== undefined) return hs;
    if (this.pauseOnHover() === true) return 0;
    return undefined;
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    const token = this.effectiveToken();
    if (token) {
      fireBeacon(token);
    }
  }

  ngAfterViewInit(): void {
    this.updateDimensions();
    this.trackImageLoads();
    this.startAnimation();

    // INC-8: ResizeObserver for dynamic dimension updates
    const containerEl = this.containerRef?.nativeElement;
    if (containerEl && typeof window !== "undefined") {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.updateDimensions());
        this.resizeObserver.observe(containerEl);
      } else {
        window.addEventListener("resize", this.handleResize);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.handleResize);
    }
  }

  // ---------------------------------------------------------------------------
  // Hover handlers
  // ---------------------------------------------------------------------------

  handleMouseEnter(): void {
    if (this.effectiveHoverSpeed() !== undefined) {
      this.isHovered.set(true);
    }
  }

  handleMouseLeave(): void {
    if (this.effectiveHoverSpeed() !== undefined) {
      this.isHovered.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------

  private updateDimensions(): void {
    const containerEl = this.containerRef?.nativeElement;
    const trackEl = this.trackRef?.nativeElement;
    if (!containerEl || !trackEl) return;

    const firstList = trackEl.querySelector("ul");
    if (!firstList) return;

    const rect = firstList.getBoundingClientRect();
    const sw = rect.width;
    const sh = rect.height;

    if (this.isVertical()) {
      const parentH = containerEl.parentElement?.clientHeight ?? 0;
      if (parentH > 0) {
        containerEl.style.height = `${Math.ceil(parentH)}px`;
      }
      if (sh > 0) {
        this.seqHeight.set(Math.ceil(sh));
        const viewport = containerEl.clientHeight || parentH || sh;
        const copies =
          Math.ceil(viewport / sh) + ANIMATION_CONFIG.COPY_HEADROOM;
        this.copyCount.set(Math.max(ANIMATION_CONFIG.MIN_COPIES, copies));
      }
    } else if (sw > 0) {
      this.seqWidth.set(Math.ceil(sw));
      const containerW = containerEl.clientWidth || 0;
      const copies =
        Math.ceil(containerW / sw) + ANIMATION_CONFIG.COPY_HEADROOM;
      this.copyCount.set(Math.max(ANIMATION_CONFIG.MIN_COPIES, copies));
    }
  }

  // INC-9: Track image load events before measuring
  private trackImageLoads(): void {
    const trackEl = this.trackRef?.nativeElement;
    if (!trackEl) return;
    const images = trackEl.querySelectorAll("ul:first-child img");
    if (images.length === 0) return;
    let remaining = images.length;
    const done = () => {
      remaining--;
      if (remaining === 0) this.updateDimensions();
    };
    images.forEach((img) => {
      const el = img as HTMLImageElement;
      if (el.complete) {
        done();
      } else {
        el.addEventListener("load", done, { once: true });
        el.addEventListener("error", done, { once: true });
      }
    });
  }

  private startAnimation(): void {
    const trackEl = this.trackRef?.nativeElement;
    if (!trackEl) return;

    // INC-7: prefers-reduced-motion support
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      trackEl.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    let lastTime: number | null = null;
    this.currentVelocity = this.targetVelocity();

    const tick = (now: number) => {
      if (lastTime === null) {
        lastTime = now;
        this.animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // INC-10: dt capping with floor at 0
      const dt = Math.min(Math.max(0, (now - lastTime) / 1000), 0.1);
      lastTime = now;

      // B-1 / INC-6: Use hover speed directly, not ratio-based
      const hs = this.effectiveHoverSpeed();
      const target =
        this.isHovered() && hs !== undefined ? hs : this.targetVelocity();

      // Smooth velocity easing
      const tau = ANIMATION_CONFIG.SMOOTH_TAU;
      const alpha = 1 - Math.exp(-dt / tau);
      this.currentVelocity += (target - this.currentVelocity) * alpha;

      // Update offset
      this.offset += this.currentVelocity * dt;

      // Wrap offset
      const seqSize = this.isVertical()
        ? this.seqHeight()
        : this.seqWidth();
      if (seqSize > 0) {
        this.offset = ((this.offset % seqSize) + seqSize) % seqSize;
      }

      // INC-5: Apply transform using translate3d for GPU acceleration
      if (this.isVertical()) {
        trackEl.style.transform = `translate3d(0, ${-this.offset}px, 0)`;
      } else {
        trackEl.style.transform = `translate3d(${-this.offset}px, 0, 0)`;
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
