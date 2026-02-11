import {
  Component,
  computed,
  contentChild,
  inject,
  input,
  OnInit,
  TemplateRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { logoUrl } from "@quikturn/logos";
import type { SupportedOutputFormat, ThemeOption } from "@quikturn/logos";
import { QUIKTURN_CONFIG } from "./providers";
import { fireBeacon } from "./beacon";
import { isValidHref } from "./validate-href";
import type { LogoConfig, ResolvedLogo } from "./types";

/** Standalone component that renders a grid of Quikturn logos. */
@Component({
  selector: "quikturn-logo-grid",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      role="region"
      [attr.aria-label]="ariaLabel()"
      [class]="cssClass()"
      [style.display]="'grid'"
      [style.grid-template-columns]="'repeat(' + columns() + ', 1fr)'"
      [style.gap.px]="gap()"
      [style.align-items]="'center'"
      [style.justify-items]="'center'"
    >
      @for (logo of resolvedLogos(); track logo.domain; let i = $index) {
        @if (customTemplate()) {
          <ng-container
            [ngTemplateOutlet]="customTemplate()!"
            [ngTemplateOutletContext]="{ $implicit: logo, index: i }"
          ></ng-container>
        } @else {
          <div style="display: flex; align-items: center; justify-content: center;">
            @if (logo.href) {
              <a
                [href]="logo.href"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="logo.alt"
              >
                <img
                  [src]="logo.url"
                  [alt]="logo.alt"
                  loading="lazy"
                  style="max-width: 100%; height: auto; display: block;"
                />
              </a>
            } @else {
              <img
                [src]="logo.url"
                [alt]="logo.alt"
                loading="lazy"
                style="max-width: 100%; height: auto; display: block;"
              />
            }
          </div>
        }
      }
    </div>
  `,
})
export class QuikturnLogoGridComponent implements OnInit {
  private readonly config = inject(QUIKTURN_CONFIG, { optional: true });

  /** Array of domain strings to render logos for. */
  domains = input<string[] | undefined>(undefined);

  /** Array of LogoConfig objects for per-logo customization. */
  logos = input<LogoConfig[] | undefined>(undefined);

  /** Override the token from the config provider. */
  token = input<string | undefined>(undefined);

  /** Override the baseUrl from the config provider. */
  baseUrl = input<string | undefined>(undefined);

  /** Number of grid columns. Defaults to 4. */
  columns = input<number>(4);

  /** Gap between grid items in pixels. Defaults to 24. */
  gap = input<number>(24);

  /** Default logo size applied to all logos. */
  logoSize = input<number | undefined>(undefined);

  /** Default logo format applied to all logos. */
  logoFormat = input<string | undefined>(undefined);

  /** Default greyscale setting applied to all logos. */
  logoGreyscale = input<boolean | undefined>(undefined);

  /** Default theme applied to all logos. */
  logoTheme = input<string | undefined>(undefined);

  /** CSS class applied to the grid container. */
  cssClass = input<string | undefined>(undefined, { alias: "class" });

  /** Accessible label for the grid region. Defaults to "Company logos". */
  ariaLabel = input<string>("Company logos");

  /** Optional custom template for rendering each logo item. */
  customTemplate = contentChild<TemplateRef<{ $implicit: ResolvedLogo; index: number }>>("renderItem");

  /** Effective token: input override takes precedence over config. */
  protected readonly effectiveToken = computed(
    () => this.token() ?? this.config?.token ?? "",
  );

  /** Effective base URL: input override takes precedence over config. */
  protected readonly effectiveBaseUrl = computed(
    () => this.baseUrl() ?? this.config?.baseUrl,
  );

  /** Resolved logos with pre-built URLs from either domains[] or logos[] input. */
  protected readonly resolvedLogos = computed<ResolvedLogo[]>(() => {
    const items: LogoConfig[] =
      this.logos() ?? (this.domains() ?? []).map((d) => ({ domain: d }));

    return items.map((item) => ({
      domain: item.domain,
      alt: item.alt ?? `${item.domain} logo`,
      href: item.href && isValidHref(item.href) ? item.href : undefined,
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

  ngOnInit(): void {
    const t = this.effectiveToken();
    if (t) fireBeacon(t);
  }
}
