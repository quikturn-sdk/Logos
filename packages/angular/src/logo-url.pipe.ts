import { inject, Pipe, PipeTransform } from "@angular/core";
import { logoUrl } from "@quikturn/logos";
import { QUIKTURN_CONFIG } from "./providers";
import type { LogoOptions } from "./types";

/** Pipe that transforms a domain string into a Quikturn logo URL. */
@Pipe({ name: "logoUrl", standalone: true })
export class LogoUrlPipe implements PipeTransform {
  private readonly config = inject(QUIKTURN_CONFIG, { optional: true });

  transform(
    domain: string,
    options?: LogoOptions & { token?: string; baseUrl?: string },
  ): string {
    const token = options?.token ?? this.config?.token;
    const baseUrl = options?.baseUrl ?? this.config?.baseUrl;

    return logoUrl(domain, {
      token,
      baseUrl,
      size: options?.size,
      format: options?.format,
      greyscale: options?.greyscale,
      theme: options?.theme,
    });
  }
}
