/** Returns true if the href is safe (http/https/relative). Returns false for javascript:, data:, etc. */
export function isValidHref(href: string): boolean {
  try {
    const url = new URL(href, "https://placeholder.invalid");
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
