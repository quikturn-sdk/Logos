/**
 * @quikturn/logos SDK — Server Client Class
 *
 * High-level API for fetching logos on the server (Node.js). Integrates the
 * URL builder, server fetcher, batch module, scrape poller, and header parser
 * into a single ergonomic class with event emission.
 *
 * Unlike the browser client, the server client:
 * - Requires a secret key (sk_ prefix) instead of publishable keys.
 * - Sends authentication via Authorization: Bearer header, not query params.
 * - Returns raw Buffers instead of Blobs.
 * - Provides getStream() for streaming responses.
 * - Provides getMany() for concurrent batch fetching.
 *
 * Usage:
 * ```ts
 * import { QuikturnLogos } from "@quikturn/logos/server";
 *
 * const client = new QuikturnLogos({ secretKey: "sk_your_key" });
 * const { buffer, contentType, metadata } = await client.get("github.com", { size: 256 });
 * ```
 */

import type {
  ServerLogoResponse,
  ThemeOption,
  LogoVariant,
  SupportedOutputFormat,
  FormatShorthand,
  ScrapeProgressEvent,
  LogoMetadata,
} from "../types";
import { logoUrl } from "../url-builder";
import { parseLogoHeaders } from "../headers";
import { serverFetch } from "./fetcher";
import { getMany } from "./batch";
import type { BatchOptions, BatchResult } from "./batch";
import { handleScrapeResponse } from "../client/scrape-poller";
import { AuthenticationError, LogoError } from "../errors";
import { MAX_RESPONSE_BODY_BYTES } from "../constants";

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

/**
 * Configuration options for the server client constructor.
 *
 * - `secretKey`  — Required secret key (sk_ prefix). Publishable keys (qt_/pk_) are rejected.
 * - `baseUrl`    — Override the default API base URL. Useful for testing or proxied environments.
 * - `maxRetries` — Maximum number of retry attempts for rate-limited/server-error responses. Default: 2.
 */
export interface ServerClientOptions {
  secretKey: string;
  baseUrl?: string;
  maxRetries?: number;
}

/**
 * Options accepted by {@link QuikturnLogos.get} and {@link QuikturnLogos.getStream}.
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
export interface ServerGetOptions {
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
 * Server client for the Quikturn Logos API.
 *
 * Manages the full lifecycle of logo requests including URL construction,
 * network fetching with Bearer token authentication and retries, scrape
 * polling, response parsing, batch fetching, and streaming.
 */
export class QuikturnLogos {
  private readonly secretKey: string;
  private readonly baseUrl?: string;
  private readonly maxRetries: number;
  private readonly listeners: Map<ClientEvent, Set<EventHandler>>;

  constructor(options: ServerClientOptions) {
    const key = options.secretKey?.trim() ?? "";
    if (!key) {
      throw new AuthenticationError("Secret key is required");
    }
    if (!key.startsWith("sk_")) {
      throw new AuthenticationError(
        "Server client requires a secret key (sk_ prefix)",
      );
    }

    this.secretKey = key;
    this.baseUrl = options.baseUrl;
    this.maxRetries = options.maxRetries ?? 2;
    this.listeners = new Map();
  }

  /**
   * Fetches a logo for the given domain and returns a {@link ServerLogoResponse}.
   *
   * The returned `buffer` is a Node.js Buffer containing the raw image bytes.
   *
   * @param domain  - The domain to fetch a logo for (e.g. "github.com").
   * @param options - Optional request configuration.
   * @returns A ServerLogoResponse containing the Buffer, content type, and metadata.
   *
   * @example
   * ```ts
   * const client = new QuikturnLogos({ secretKey: "sk_your_key" });
   * const { buffer, contentType } = await client.get("github.com", { size: 256 });
   * fs.writeFileSync("logo.png", buffer);
   * ```
   */
  async get(
    domain: string,
    options?: ServerGetOptions,
  ): Promise<ServerLogoResponse> {
    // 1. Build URL WITHOUT token — server uses Authorization header, not query param
    const url = logoUrl(domain, {
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
      ? format.startsWith("image/")
        ? format
        : `image/${format}`
      : undefined;

    // 3. Fetch via server fetcher (with Authorization: Bearer header)
    let response = await serverFetch(url, {
      token: this.secretKey,
      maxRetries: this.maxRetries,
      signal: options?.signal,
      format: acceptHeader,
      onRateLimitWarning: (remaining, limit) =>
        this.emit("rateLimitWarning", remaining, limit),
      onQuotaWarning: (remaining, limit) =>
        this.emit("quotaWarning", remaining, limit),
    });

    // 4. Handle 202 scrape responses (always enabled)
    const fetchForPoller = (fetchUrl: string) =>
      serverFetch(fetchUrl, {
        token: this.secretKey,
        maxRetries: this.maxRetries,
        signal: options?.signal,
      });

    response = await handleScrapeResponse(
      response,
      url,
      fetchForPoller,
      {
        scrapeTimeout: options?.scrapeTimeout,
        onScrapeProgress: options?.onScrapeProgress,
        signal: options?.signal,
      },
    );

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

    // 6. Parse response into ServerLogoResponse
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType =
      response.headers.get("Content-Type") || "image/png";
    const metadata: LogoMetadata = parseLogoHeaders(response.headers);

    return { buffer, contentType, metadata };
  }

  /**
   * Fetches logos for multiple domains with concurrency control.
   *
   * Yields {@link BatchResult} items in the same order as the input domains.
   * Delegates to the batch module's `getMany` with a fetch function that
   * calls `this.get()` internally.
   *
   * @param domains - Array of domain strings to fetch logos for.
   * @param options - Optional batch configuration (concurrency, format, etc.).
   * @yields BatchResult items for each domain.
   *
   * @example
   * ```ts
   * const client = new QuikturnLogos({ secretKey: "sk_your_key" });
   * for await (const result of client.getMany(["github.com", "gitlab.com"])) {
   *   if (result.success) {
   *     fs.writeFileSync(`${result.domain}.png`, result.buffer!);
   *   }
   * }
   * ```
   */
  async *getMany(
    domains: string[],
    options?: Omit<BatchOptions, "signal"> & { signal?: AbortSignal },
  ): AsyncGenerator<BatchResult> {
    const fetchForBatch = async (domain: string) => {
      const result = await this.get(domain, {
        size: options?.size,
        greyscale: options?.greyscale,
        theme: options?.theme,
        format: options?.format,
        variant: options?.variant,
        autoScrape: options?.autoScrape,
        signal: options?.signal,
      });
      return result;
    };

    yield* getMany(domains, fetchForBatch, {
      concurrency: options?.concurrency,
      signal: options?.signal,
      continueOnError: options?.continueOnError,
    });
  }

  /**
   * Fetches a logo and returns the raw Response body as a ReadableStream.
   *
   * Useful for piping to a file or HTTP response without buffering the
   * entire image in memory.
   *
   * @param domain  - The domain to fetch a logo for.
   * @param options - Optional request configuration.
   * @returns A ReadableStream of the response body.
   * @throws {Error} If the response body is null (streaming not available).
   *
   * @example
   * ```ts
   * const client = new QuikturnLogos({ secretKey: "sk_your_key" });
   * const stream = await client.getStream("github.com");
   * const writable = fs.createWriteStream("logo.png");
   * Readable.fromWeb(stream).pipe(writable);
   * ```
   */
  async getStream(
    domain: string,
    options?: ServerGetOptions,
  ): Promise<ReadableStream> {
    const url = logoUrl(domain, {
      size: options?.size,
      width: options?.width,
      greyscale: options?.greyscale,
      theme: options?.theme,
      format: options?.format,
      variant: options?.variant,
      autoScrape: options?.autoScrape,
      baseUrl: this.baseUrl,
    });

    const format = options?.format;
    const acceptHeader = format
      ? format.startsWith("image/")
        ? format
        : `image/${format}`
      : undefined;

    const response = await serverFetch(url, {
      token: this.secretKey,
      maxRetries: this.maxRetries,
      signal: options?.signal,
      format: acceptHeader,
    });

    if (!response.body) {
      throw new Error("Response body is null — streaming not available");
    }

    return response.body;
  }

  /**
   * Returns a plain URL string for the given domain without making a network request.
   *
   * The URL does not include authentication — use Authorization: Bearer header
   * when fetching. Secret keys (sk_) must never appear in URLs.
   *
   * @param domain  - The domain to build a URL for.
   * @param options - Optional request parameters (size, format, etc.).
   * @returns A fully-qualified Logos API URL string (without token).
   */
  getUrl(
    domain: string,
    options?: Omit<
      ServerGetOptions,
      "scrapeTimeout" | "onScrapeProgress" | "signal"
    >,
  ): string {
    return logoUrl(domain, {
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

// Re-export types needed by consumers of the class API
export type { BatchOptions, BatchResult } from "./batch";
