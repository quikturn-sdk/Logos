/**
 * Carousel animation utilities for seamless infinite scroll.
 *
 * Ported from the React carousel hooks to imperative create/destroy patterns
 * suitable for Svelte's `onMount` / `onDestroy` lifecycle.
 */
export declare const ANIMATION_CONFIG: {
    /** Exponential easing time-constant (seconds). Smaller = snappier. */
    readonly SMOOTH_TAU: 0.25;
    /** Minimum number of `<ul>` copies to render. */
    readonly MIN_COPIES: 2;
    /** Extra copies beyond what fills the viewport. */
    readonly COPY_HEADROOM: 2;
};
/**
 * Observes one or more elements for resize events (or falls back to the
 * `window.resize` event when `ResizeObserver` is unavailable).
 *
 * Returns an object with a `destroy()` method to disconnect all observers.
 */
export declare function createResizeObserver(callback: () => void, getElements: () => (Element | null)[]): {
    destroy(): void;
};
/**
 * Waits for every `<img>` inside `getListEl()` to finish loading (or error),
 * then calls `onLoad`.  Returns a `destroy()` handle to remove listeners.
 */
export declare function createImageLoader(getListEl: () => HTMLElement | null, onLoad: () => void): {
    destroy(): void;
};
/**
 * Runs a `requestAnimationFrame` loop that smoothly scrolls the track element.
 *
 * The velocity is interpolated via exponential easing toward the target so
 * that pause-on-hover / speed changes feel smooth.
 *
 * Offset wraps around using modulo arithmetic for a seamless infinite loop.
 *
 * Respects `prefers-reduced-motion` by staying at zero offset.
 */
export declare function createAnimationLoop(getTrack: () => HTMLElement | null, getTargetVelocity: () => number, getSeqWidth: () => number, getSeqHeight: () => number, getIsHovered: () => boolean, getHoverSpeed: () => number | undefined, getIsVertical: () => boolean): {
    destroy(): void;
};
//# sourceMappingURL=animation.svelte.d.ts.map