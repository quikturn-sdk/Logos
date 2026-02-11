/**
 * Carousel animation utilities for seamless infinite scroll.
 *
 * Ported from the React carousel hooks to imperative create/destroy patterns
 * suitable for Svelte's `onMount` / `onDestroy` lifecycle.
 */

export const ANIMATION_CONFIG = {
  /** Exponential easing time-constant (seconds). Smaller = snappier. */
  SMOOTH_TAU: 0.25,
  /** Minimum number of `<ul>` copies to render. */
  MIN_COPIES: 2,
  /** Extra copies beyond what fills the viewport. */
  COPY_HEADROOM: 2,
} as const;

// ---------------------------------------------------------------------------
// createResizeObserver
// ---------------------------------------------------------------------------

/**
 * Observes one or more elements for resize events (or falls back to the
 * `window.resize` event when `ResizeObserver` is unavailable).
 *
 * Returns an object with a `destroy()` method to disconnect all observers.
 */
export function createResizeObserver(
  callback: () => void,
  getElements: () => (Element | null)[],
): { destroy(): void } {
  if (typeof window === "undefined") return { destroy() {} };

  if (!window.ResizeObserver) {
    const handle = () => callback();
    window.addEventListener("resize", handle);
    callback();
    return {
      destroy() {
        window.removeEventListener("resize", handle);
      },
    };
  }

  const observers: ResizeObserver[] = [];
  const elements = getElements();
  for (const el of elements) {
    if (!el) continue;
    const observer = new ResizeObserver(callback);
    observer.observe(el);
    observers.push(observer);
  }
  callback();

  return {
    destroy() {
      for (const o of observers) o.disconnect();
    },
  };
}

// ---------------------------------------------------------------------------
// createImageLoader
// ---------------------------------------------------------------------------

/**
 * Waits for every `<img>` inside `getListEl()` to finish loading (or error),
 * then calls `onLoad`.  Returns a `destroy()` handle to remove listeners.
 */
export function createImageLoader(
  getListEl: () => HTMLElement | null,
  onLoad: () => void,
): { destroy(): void } {
  const el = getListEl();
  const images = el?.querySelectorAll("img") ?? [];

  if (images.length === 0) {
    onLoad();
    return { destroy() {} };
  }

  let remaining = images.length;
  const done = () => {
    remaining -= 1;
    if (remaining === 0) onLoad();
  };

  const cleanups: Array<() => void> = [];

  images.forEach((img) => {
    const imgEl = img as HTMLImageElement;
    if (imgEl.complete) {
      done();
    } else {
      imgEl.addEventListener("load", done, { once: true });
      imgEl.addEventListener("error", done, { once: true });
      cleanups.push(() => {
        imgEl.removeEventListener("load", done);
        imgEl.removeEventListener("error", done);
      });
    }
  });

  return {
    destroy() {
      for (const fn of cleanups) fn();
    },
  };
}

// ---------------------------------------------------------------------------
// createAnimationLoop
// ---------------------------------------------------------------------------

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
export function createAnimationLoop(
  getTrack: () => HTMLElement | null,
  getTargetVelocity: () => number,
  getSeqWidth: () => number,
  getSeqHeight: () => number,
  getIsHovered: () => boolean,
  getHoverSpeed: () => number | undefined,
  getIsVertical: () => boolean,
): { destroy(): void } {
  let rafId: number | null = null;
  let lastTs: number | null = null;
  let offset = 0;
  let velocity = 0;

  const track = getTrack();
  if (!track) return { destroy() {} };

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    track.style.transform = "translate3d(0, 0, 0)";
    return { destroy() {} };
  }

  const animate = (ts: number) => {
    if (lastTs === null) lastTs = ts;
    const dt = Math.max(0, ts - lastTs) / 1000;
    lastTs = ts;

    const isVertical = getIsVertical();
    const seqSize = isVertical ? getSeqHeight() : getSeqWidth();
    const isHovered = getIsHovered();
    const hoverSpeed = getHoverSpeed();
    const targetVelocity = getTargetVelocity();

    const target =
      isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;
    const ease = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
    velocity += (target - velocity) * ease;

    if (seqSize > 0) {
      let next = offset + velocity * dt;
      next = ((next % seqSize) + seqSize) % seqSize;
      offset = next;
      track.style.transform = isVertical
        ? `translate3d(0, ${-offset}px, 0)`
        : `translate3d(${-offset}px, 0, 0)`;
    }

    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(animate);

  return {
    destroy() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTs = null;
    },
  };
}
