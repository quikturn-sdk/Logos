/**
 * @quikturn/logos SDK — Web Component Shadow DOM Styles
 *
 * All attribution properties use `!important` to resist external override
 * attempts. No `part` attributes are exposed, preventing `::part()` targeting.
 */

export const STYLES = /* css */ `
  :host {
    display: inline-block !important;
    line-height: 0 !important;
  }

  .qt-logo-container {
    display: inline-flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 4px !important;
  }

  .qt-logo-img {
    display: block !important;
    max-width: 100% !important;
    height: auto !important;
  }

  .qt-attribution {
    display: block !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 10px !important;
    color: #888 !important;
    text-decoration: none !important;
    white-space: nowrap !important;
  }

  .qt-attribution:hover {
    color: #555 !important;
    text-decoration: underline !important;
  }
`;
