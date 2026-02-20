/**
 * @quikturn/logos SDK — Browser Client Class
 *
 * High-level API for fetching logos in the browser. Integrates the URL builder,
 * browser fetcher, scrape poller, and header parser into a single ergonomic
 * class with lifecycle management and event emission.
 *
 * Usage:
 * ```ts
 * import { QuikturnLogos } from "@quikturn/logos/client";
 *
 * const client = new QuikturnLogos({ token: "qt_your_key" });
 * const { url, blob, metadata } = await client.get("github.com", { size: 256 });
 * document.querySelector("img").src = url;
 *
 * // Clean up when done
 * client.destroy();
 * ```
 */

import type {
  BrowserLogoResponse,
  ThemeOption,
  LogoVariant,
  SupportedOutputFormat,
  FormatShorthand,
  ScrapeProgressEvent,
  LogoMetadata,
} from "../types";
import { logoUrl } from "../url-builder";
import { parseLogoHeaders } from "../headers";
import { browserFetch } from "./fetcher";
import { handleScrapeResponse } from "./scrape-poller";
import { AuthenticationError, LogoError } from "../errors";
import { MAX_RESPONSE_BODY_BYTES } from "../constants";
import { fireBeacon } from "../internal/beacon";

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

/**
 * Configuration options for the browser client constructor.
 *
 * - `token`      — Required publishable key (qt_/pk_ prefix). Server keys (sk_) are rejected.
 * - `baseUrl`    — Override the default API base URL. Useful for testing or proxied environments.
 * - `maxRetries` — Maximum number of retry attempts for rate-limited/server-error responses. Default: 2.
 */
export interface BrowserClientOptions {
  token: string;
  baseUrl?: string;
  maxRetries?: number;
}

/**
 * Options accepted by {@link QuikturnLogos.get}.
 *
 * - `size`            — Output width in pixels.
 * - `width`           — Alias for `size`.
 * - `greyscale`       — When true, returns a greyscale image.
 * - `theme`           — "light" or "dark" gamma adjustment.
 * - `format`          — Output image format (MIME type or shorthand).
 * - `scrapeTimeout`   — Maximum time (ms) to wait for a scrape to complete.
 * - `onScrapeProgress`— Callback fired on each scrape poll.
 * - `signal`          — AbortSignal to cancel the request.
 */
export interface GetOptions {
  size?: number;
  width?: number;
  greyscale?: boolean;
  theme?: ThemeOption;
  format?: SupportedOutputFormat | FormatShorthand;
  variant?: LogoVariant;
  autoScrape?: boolean;
  scrapeTimeout?: number;
  onScrapeProgress?: (event: ScrapeProgressEvent) => void;
  signal?: AbortSignal;
}

/** Events emitted by the client via the on()/off() interface. */
export type ClientEvent = "rateLimitWarning" | "quotaWarning";

/** Handler signature for client events. Receives the remaining count and tier limit. */
export type EventHandler = (remaining: number, limit: number) => void;

// ---------------------------------------------------------------------------
// Client Class
// ---------------------------------------------------------------------------

/**
 * Browser client for the Quikturn Logos API.
 *
 * Manages the full lifecycle of logo requests including URL construction,
 * network fetching with retries, scrape polling, response parsing, and
 * blob URL management.
 *
 * The client tracks all created `blob:` object URLs and revokes them on
 * {@link destroy}, preventing memory leaks in long-lived browser sessions.
 */
export class QuikturnLogos {
  private readonly token: string;
  private readonly baseUrl?: string;
  private readonly maxRetries: number;
  private readonly listeners: Map<ClientEvent, Set<EventHandler>>;
  private readonly objectUrls: Set<string>;

  constructor(options: BrowserClientOptions) {
    const token = options.token?.trim() ?? "";
    if (!token) {
      throw new AuthenticationError("Token is required");
    }
    if (token.startsWith("sk_")) {
      throw new AuthenticationError(
        "Server keys (sk_) are not allowed in the browser client",
      );
    }

    this.token = token;
    this.baseUrl = options.baseUrl;
    this.maxRetries = options.maxRetries ?? 2;
    this.listeners = new Map();
    this.objectUrls = new Set();
  }

  /**
   * Fetches a logo for the given domain and returns a {@link BrowserLogoResponse}.
   *
   * The returned `url` is a `blob:` object URL suitable for `<img src>`.
   * The client tracks these URLs and revokes them on {@link destroy}.
   *
   * @param domain  - The domain to fetch a logo for (e.g. "github.com").
   * @param options - Optional request configuration.
   * @returns A BrowserLogoResponse containing the blob URL, raw Blob, content type, and metadata.
   *
   * @example
   * ```ts
   * const client = new QuikturnLogos({ token: "qt_abc123" });
   * const { url, metadata } = await client.get("github.com", { size: 256 });
   * document.querySelector("img")!.src = url;
   * ```
   */
  async get(domain: string, options?: GetOptions): Promise<BrowserLogoResponse> {
    // 1. Build the API URL via the URL builder
    const url = logoUrl(domain, {
      token: this.token,
      size: options?.size,
      width: options?.width,
      greyscale: options?.greyscale,
      theme: options?.theme,
      format: options?.format,
      variant: options?.variant,
      autoScrape: options?.autoScrape,
      baseUrl: this.baseUrl,
    });

    // 2. Resolve Accept header from the format option
    const format = options?.format;
    const acceptHeader = format
      ? (format.startsWith("image/") ? format : `image/${format}`)
      : undefined;

    // 3. Fetch the logo via the browser fetcher
    let response = await browserFetch(url, {
      maxRetries: this.maxRetries,
      signal: options?.signal,
      format: acceptHeader,
      onRateLimitWarning: (remaining, limit) =>
        this.emit("rateLimitWarning", remaining, limit),
      onQuotaWarning: (remaining, limit) =>
        this.emit("quotaWarning", remaining, limit),
    });

    // 4. Handle 202 scrape responses (always enabled)
    response = await handleScrapeResponse(response, url, browserFetch, {
      scrapeTimeout: options?.scrapeTimeout,
      onScrapeProgress: options?.onScrapeProgress,
      signal: options?.signal,
      token: this.token,
    });

    // 5. Check response body size before consuming
    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!Number.isNaN(size) && size > MAX_RESPONSE_BODY_BYTES) {
        throw new LogoError(
          `Response body (${size} bytes) exceeds maximum allowed size`,
          "UNEXPECTED_ERROR",
        );
      }
    }

    // 6. Parse the response into a BrowserLogoResponse
    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type") || "image/png";
    const metadata: LogoMetadata = parseLogoHeaders(response.headers);

    // 6. Create a blob URL and track it for cleanup
    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.add(objectUrl);

    // Fire attribution beacon
    fireBeacon(this.token);

    return { url: objectUrl, blob, contentType, metadata };
  }

  /**
   * Returns a plain URL string for the given domain without making a network request.
   *
   * Useful for `<img>` tags, CSS `background-image`, or preloading hints where
   * a direct URL is needed rather than a blob.
   *
   * @param domain  - The domain to build a URL for.
   * @param options - Optional request parameters (size, format, etc.).
   * @returns A fully-qualified Logos API URL string.
   *
   * @example
   * ```ts
   * const client = new QuikturnLogos({ token: "qt_abc123" });
   * const url = client.getUrl("github.com", { size: 128, format: "webp" });
   * // => "https://logos.getquikturn.io/github.com?token=qt_abc123&format=webp"
   * ```
   */
  getUrl(
    domain: string,
    options?: Omit<GetOptions, "scrapeTimeout" | "onScrapeProgress" | "signal">,
  ): string {
    return logoUrl(domain, {
      token: this.token,
      size: options?.size,
      width: options?.width,
      greyscale: options?.greyscale,
      theme: options?.theme,
      format: options?.format,
      variant: options?.variant,
      autoScrape: options?.autoScrape,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Registers an event listener for a client event.
   *
   * @param event   - The event name ("rateLimitWarning" or "quotaWarning").
   * @param handler - Callback invoked with (remaining, limit) when the event fires.
   */
  on(event: ClientEvent, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Removes a previously registered event listener.
   *
   * @param event   - The event name.
   * @param handler - The handler to remove.
   */
  off(event: ClientEvent, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Cleans up client resources.
   *
   * Revokes all tracked `blob:` object URLs to free memory, and removes
   * all registered event listeners. The client instance can still be used
   * after destroy, but previously created blob URLs will no longer work.
   */
  destroy(): void {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls.clear();
    this.listeners.clear();
  }

  /**
   * Emits an event to all registered listeners.
   *
   * @param event     - The event name to emit.
   * @param remaining - The remaining count.
   * @param limit     - The tier limit.
   */
  private emit(event: ClientEvent, remaining: number, limit: number): void {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(remaining, limit);
    }
  }
}

