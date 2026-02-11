import "server-only";
import { QuikturnLogos } from "@quikturn/logos/server";
import type { ServerGetOptions } from "@quikturn/logos/server";

let cached: QuikturnLogos | null = null;

/**
 * Returns a singleton {@link QuikturnLogos} server client.
 *
 * Reads the `QUIKTURN_SECRET_KEY` environment variable on first call and
 * caches the client instance for subsequent calls.
 *
 * @throws {Error} If `QUIKTURN_SECRET_KEY` is not set.
 */
export function getServerClient(): QuikturnLogos {
  if (!cached) {
    const key = process.env.QUIKTURN_SECRET_KEY;
    if (!key) {
      throw new Error(
        "QUIKTURN_SECRET_KEY environment variable is not set. " +
          "Set it in your .env.local file or deployment environment.",
      );
    }
    cached = new QuikturnLogos({ secretKey: key });
  }
  return cached;
}

/**
 * Convenience wrapper that fetches a logo buffer for a domain using the
 * cached server client.
 *
 * @param domain  - The domain to fetch a logo for (e.g. "github.com").
 * @param options - Optional request options forwarded to `client.get()`.
 * @returns The server logo response containing a Buffer, content type, and metadata.
 */
export async function getLogoBuffer(
  domain: string,
  options?: ServerGetOptions,
): Promise<ReturnType<QuikturnLogos["get"]>> {
  return getServerClient().get(domain, options);
}

/** @internal */
export function _resetServerClient(): void {
  cached = null;
}

export { QuikturnLogos } from "@quikturn/logos/server";
