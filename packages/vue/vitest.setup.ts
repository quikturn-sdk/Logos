import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver (not available in jsdom)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
