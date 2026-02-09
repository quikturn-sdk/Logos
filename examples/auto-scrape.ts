/**
 * Example: Auto-scrape Flow with Progress UI
 *
 * When a logo is not in the Quikturn database, the auto-scrape feature
 * triggers a background scrape job and polls for completion. This example
 * shows how to wire up progress reporting and cancellation using the
 * browser client.
 *
 * Key concepts:
 * - `autoScrape: true` opts in to background scraping on 404
 * - `onScrapeProgress` receives ScrapeProgressEvent updates during polling
 * - `scrapeTimeout` caps the maximum wait time (ms)
 * - `signal` via AbortController enables user-initiated cancellation
 * - `client.destroy()` revokes all blob: URLs to prevent memory leaks
 */

import { QuikturnLogos } from "@quikturn/logos/client";
import { ScrapeTimeoutError, NotFoundError } from "@quikturn/logos";
import type {
  ScrapeProgressEvent,
  BrowserLogoResponse,
} from "@quikturn/logos";

// ---------------------------------------------------------------------------
// Client Setup
// ---------------------------------------------------------------------------

const client = new QuikturnLogos({ token: "qt_your_publishable_key" });

// Listen for rate-limit and quota warnings emitted by the client.
// These fire when response headers indicate the remaining allowance is low.
client.on("rateLimitWarning", (remaining: number, limit: number) => {
  console.warn(`Rate limit warning: ${remaining}/${limit} requests remaining`);
});

client.on("quotaWarning", (remaining: number, limit: number) => {
  console.warn(`Quota warning: ${remaining}/${limit} monthly requests remaining`);
});

// ---------------------------------------------------------------------------
// Auto-scrape Helper
// ---------------------------------------------------------------------------

/**
 * Fetches a logo with auto-scrape enabled. If the logo is not already
 * cached, the API starts a background scrape and the SDK polls until
 * completion or timeout.
 *
 * @param domain     - Domain to fetch the logo for.
 * @param onProgress - Optional callback for UI progress updates.
 * @returns The browser logo response (blob URL, blob, contentType, metadata).
 */
async function fetchLogoWithScrape(
  domain: string,
  onProgress?: (status: string, progress?: number) => void,
): Promise<BrowserLogoResponse> {
  const controller = new AbortController();

  // Optional: set a UI-level timeout that is longer than the SDK's
  // scrapeTimeout, so the user sees a clean cancellation message.
  const uiTimeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const result = await client.get(domain, {
      autoScrape: true,
      scrapeTimeout: 45_000, // max 45s for the scrape job
      signal: controller.signal,

      // Called on each poll cycle while the scrape job is in progress
      onScrapeProgress: (event: ScrapeProgressEvent) => {
        switch (event.status) {
          case "pending":
            onProgress?.("Scraping...", event.progress);
            break;
          case "complete":
            onProgress?.("Logo found!", 100);
            break;
          case "failed":
            onProgress?.(`Scrape failed: ${event.error ?? "unknown reason"}`, undefined);
            break;
        }
      },
    });

    return result;
  } catch (error) {
    if (error instanceof ScrapeTimeoutError) {
      // ScrapeTimeoutError includes the jobId and elapsed time
      onProgress?.(
        `Scrape timed out after ${error.elapsed}ms (job: ${error.jobId})`,
        undefined,
      );
    } else if (error instanceof NotFoundError) {
      onProgress?.(`No logo found for ${error.domain}`, undefined);
    }
    throw error;
  } finally {
    clearTimeout(uiTimeout);
  }
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

async function main() {
  try {
    const result = await fetchLogoWithScrape(
      "new-startup.com",
      (status, progress) => {
        if (progress !== undefined) {
          console.log(`[${progress}%] ${status}`);
        } else {
          console.log(status);
        }
      },
    );

    console.log("Logo URL:", result.url); // blob: URL for <img src>
    console.log("Content-Type:", result.contentType);
    console.log("Cache status:", result.metadata.cache.status);
    console.log("Rate limit remaining:", result.metadata.rateLimit.remaining);

    // Use the blob URL in an <img> element:
    // document.querySelector("img")!.src = result.url;
  } catch (error) {
    if (error instanceof ScrapeTimeoutError) {
      console.error("The scrape job did not complete in time.");
    } else if (error instanceof NotFoundError) {
      console.error("No logo exists and scraping was not possible.");
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

main();

// ---------------------------------------------------------------------------
// Cleanup
//
// Call client.destroy() to revoke all blob: object URLs created by get().
// This prevents memory leaks in long-lived single-page applications.
// ---------------------------------------------------------------------------

// window.addEventListener("beforeunload", () => client.destroy());
