import { Component, computed, inject, input, OnInit, output } from "@angular/core";
import { logoUrl } from "@quikturn/logos";
import type { SupportedOutputFormat, ThemeOption } from "@quikturn/logos";
import { QUIKTURN_CONFIG } from "./providers";
import { fireBeacon } from "./beacon";
import { isValidHref } from "./validate-href";

/** Standalone component that renders a single Quikturn logo image. */
@Component({
  selector: "quikturn-logo",
  standalone: true,
  template: `
    @if (safeHref()) {
      <a [href]="safeHref()" target="_blank" rel="noopener noreferrer" [class]="cssClass()">
        <img [src]="src()" [alt]="altText()" [attr.loading]="loading()" (error)="imgError.emit($event)" (load)="imgLoad.emit($event)" />
      </a>
    } @else if (cssClass()) {
      <span [class]="cssClass()">
        <img [src]="src()" [alt]="altText()" [attr.loading]="loading()" (error)="imgError.emit($event)" (load)="imgLoad.emit($event)" />
      </span>
    } @else {
      <img [src]="src()" [alt]="altText()" [attr.loading]="loading()" (error)="imgError.emit($event)" (load)="imgLoad.emit($event)" />
    }
  `,
})
export class QuikturnLogoComponent implements OnInit {
  private readonly config = inject(QUIKTURN_CONFIG, { optional: true });

  /** The domain to fetch a logo for (e.g. "github.com"). Required. */
  domain = input.required<string>();

  /** Override the token from the config provider. */
  token = input<string | undefined>(undefined);

  /** Override the baseUrl from the config provider. */
  baseUrl = input<string | undefined>(undefined);

  /** Logo width in pixels. */
  size = input<number | undefined>(undefined);

  /** Output format (e.g. "png", "webp", "jpeg", "avif"). */
  format = input<string | undefined>(undefined);

  /** Whether to render the logo in greyscale. */
  greyscale = input<boolean | undefined>(undefined);

  /** Theme option ("light" or "dark"). */
  theme = input<string | undefined>(undefined);

  /** Custom alt text for the image. Defaults to "${domain} logo". */
  alt = input<string | undefined>(undefined);

  /** If provided, wraps the image in an anchor tag linking to this URL. */
  href = input<string | undefined>(undefined);

  /** CSS class applied to a wrapper element (span or anchor). */
  cssClass = input<string | undefined>(undefined, { alias: "class" });

  /** Image loading strategy. Defaults to "lazy". */
  loading = input<"lazy" | "eager">("lazy");

  /** Emitted when the logo image fails to load. */
  imgError = output<Event>();

  /** Emitted when the logo image loads successfully. */
  imgLoad = output<Event>();

  /** Effective token: input override takes precedence over config. */
  protected readonly effectiveToken = computed(
    () => this.token() ?? this.config?.token ?? "",
  );

  /** Effective base URL: input override takes precedence over config. */
  protected readonly effectiveBaseUrl = computed(
    () => this.baseUrl() ?? this.config?.baseUrl,
  );

  /** Validated href: only http/https URLs are allowed. */
  protected readonly safeHref = computed(() => {
    const h = this.href();
    return h && isValidHref(h) ? h : undefined;
  });

  /** Fully-qualified logo URL built from domain and options. */
  protected readonly src = computed(() =>
    logoUrl(this.domain(), {
      token: this.effectiveToken() || undefined,
      size: this.size(),
      format: this.format() as SupportedOutputFormat | undefined,
      greyscale: this.greyscale(),
      theme: this.theme() as ThemeOption | undefined,
      baseUrl: this.effectiveBaseUrl(),
    }),
  );

  /** Alt text: custom override or default "${domain} logo". */
  protected readonly altText = computed(
    () => this.alt() ?? `${this.domain()} logo`,
  );

  ngOnInit(): void {
    const t = this.effectiveToken();
    if (t) fireBeacon(t);
  }
}
