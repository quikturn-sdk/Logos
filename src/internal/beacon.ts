/**
 * @quikturn/logos SDK — Attribution Beacon
 *
 * Browser-only module that fires a 1x1 tracking pixel to notify the Quikturn
 * server which pages are using the Logos API. Deduplicates by token so each
 * token fires at most once per page load.
 */

import { BASE_URL } from "../constants";

/** Tracks which tokens have already fired a beacon on this page. */
const firedTokens = new Set<string>();

/**
 * Fires a 1x1 beacon pixel to the Quikturn attribution endpoint.
 *
 * - **Deduplication**: Only fires once per token per page load.
 * - **Skip conditions**: Empty token, `sk_` prefix (server keys).
 * - **SSR safety**: No-ops when `window` is not defined.
 *
 * @param token - The publishable API token (qt_/pk_ prefix).
 */
export function fireBeacon(token: string): void {
  // SSR guard
  if (typeof window === "undefined") return;

  // Skip empty tokens
  if (!token) return;

  // Skip server keys
  if (token.startsWith("sk_")) return;

  // Deduplicate per token
  if (firedTokens.has(token)) return;
  firedTokens.add(token);

  // Fire the beacon
  const img = new Image();
  img.src = `${BASE_URL}/_beacon?token=${token}&page=${encodeURIComponent(location.href)}`;
}

/**
 * Resets the internal deduplication set. Exposed for testing only.
 * @internal
 */
export function _resetBeacon(): void {
  firedTokens.clear();
}
