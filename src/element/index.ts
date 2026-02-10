/**
 * @quikturn/logos SDK — `<quikturn-logo>` Web Component
 *
 * Zero-effort attribution element for free-tier users. Uses shadow DOM to
 * protect the attribution badge from accidental removal.
 *
 * Usage:
 * ```html
 * <script type="module" src="@quikturn/logos/element"></script>
 * <quikturn-logo domain="github.com" token="qt_abc123" size="64"></quikturn-logo>
 * ```
 */

import type { LogoRequestOptions } from "../types";
import { logoUrl } from "../url-builder";
import { fireBeacon } from "../internal/beacon";
import { STYLES } from "./styles";

/**
 * Custom element that renders a Quikturn logo with attribution.
 *
 * Observed attributes: `domain`, `token`, `size`, `format`, `greyscale`, `theme`.
 */
export class QuikturnLogo extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["domain", "token", "size", "format", "greyscale", "theme"];
  }

  private _beaconFired = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this._fireBeaconOnce();
    this._render();
  }

  attributeChangedCallback(): void {
    // Only re-render if we have a shadow root (i.e., after construction)
    if (this.shadowRoot) {
      this._render();
    }
  }

  private _fireBeaconOnce(): void {
    if (this._beaconFired) return;

    const domain = this.getAttribute("domain");
    const token = this.getAttribute("token") ?? "";

    // Only fire beacon when domain is present
    if (!domain) return;

    this._beaconFired = true;
    fireBeacon(token);
  }

  private _clearShadow(): void {
    const shadow = this.shadowRoot;
    if (!shadow) return;
    while (shadow.firstChild) {
      shadow.removeChild(shadow.firstChild);
    }
  }

  private _render(): void {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    const domain = this.getAttribute("domain");

    // Clear previous content using safe DOM methods
    this._clearShadow();

    // Always add styles
    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);

    // Don't render image if domain is absent
    if (!domain) return;

    const token = this.getAttribute("token") ?? "";
    const size = this.getAttribute("size");
    const format = this.getAttribute("format");
    const greyscale = this.hasAttribute("greyscale");
    const theme = this.getAttribute("theme");

    // Build the container
    const container = document.createElement("div");
    container.className = "qt-logo-container";

    // Build the <img>
    const img = document.createElement("img");
    img.className = "qt-logo-img";
    img.loading = "lazy";
    img.alt = `${domain} logo`;
    img.src = logoUrl(domain, {
      token: token || undefined,
      size: size ? parseInt(size, 10) : undefined,
      format: format as LogoRequestOptions["format"],
      greyscale,
      theme: theme as "light" | "dark" | undefined,
    });
    container.appendChild(img);

    // Build the attribution link
    const link = document.createElement("a");
    link.className = "qt-attribution";
    link.href = `https://getquikturn.io?ref=${domain}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Powered by Quikturn";
    container.appendChild(link);

    shadow.appendChild(container);
  }
}

// Auto-register with safe guard
if (typeof customElements !== "undefined" && !customElements.get("quikturn-logo")) {
  customElements.define("quikturn-logo", QuikturnLogo);
}
