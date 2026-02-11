import { watch, onUnmounted, ref, type Ref, type ShallowRef } from "vue";

export const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2,
} as const;

/**
 * Observes resize events on the given element refs and invokes the callback.
 * Falls back to a window `resize` listener when `ResizeObserver` is unavailable.
 *
 * @param callback - Function to invoke on resize (and initially).
 * @param refs - Template refs whose elements should be observed.
 * @param deps - Getter returning an array of reactive dependencies (triggers re-setup).
 */
export function useResizeObserver(
  callback: () => void,
  refs: Array<Ref<Element | null> | ShallowRef<Element | null>>,
  deps: () => unknown[],
): void {
  watch(
    deps,
    (_value, _oldValue, onCleanup) => {
      if (typeof window === "undefined") return;

      if (!window.ResizeObserver) {
        const handle = () => callback();
        window.addEventListener("resize", handle);
        callback();
        onCleanup(() => window.removeEventListener("resize", handle));
        return;
      }

      const observers: (ResizeObserver | null)[] = refs.map((r) => {
        const el = r.value;
        if (!el) return null;
        const observer = new ResizeObserver(callback);
        observer.observe(el);
        return observer;
      });
      callback();

      onCleanup(() => {
        observers.forEach((o) => o?.disconnect());
      });
    },
    { immediate: true },
  );
}

/**
 * Tracks image load/error events inside a container element and invokes
 * `onLoad` once every `<img>` has settled (loaded or errored).
 *
 * @param listRef - Template ref pointing to the container with `<img>` children.
 * @param onLoad  - Callback fired once all images are settled.
 * @param deps    - Getter returning an array of reactive dependencies (triggers re-setup).
 */
export function useImageLoader(
  listRef: Ref<HTMLElement | null> | ShallowRef<HTMLElement | null>,
  onLoad: () => void,
  deps: () => unknown[],
): void {
  watch(
    deps,
    (_value, _oldValue, onCleanup) => {
      const images = listRef.value?.querySelectorAll("img") ?? [];
      if (images.length === 0) {
        onLoad();
        return;
      }

      let remaining = images.length;
      const done = () => {
        remaining -= 1;
        if (remaining === 0) onLoad();
      };

      images.forEach((img) => {
        const el = img as HTMLImageElement;
        if (el.complete) {
          done();
        } else {
          el.addEventListener("load", done, { once: true });
          el.addEventListener("error", done, { once: true });
        }
      });

      onCleanup(() => {
        images.forEach((img) => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
        });
      });
    },
    { immediate: true },
  );
}

/**
 * Runs a `requestAnimationFrame` loop that smoothly translates a track element,
 * creating an infinite-scroll carousel effect.
 *
 * Velocity is exponentially smoothed toward the target. When the user hovers and
 * a `hoverSpeed` is specified, the target switches to the hover speed (which may
 * be `0` for a full pause).
 *
 * Respects `prefers-reduced-motion` by pinning the track at `translate3d(0,0,0)`.
 *
 * @param trackRef       - Template ref for the scrolling track `<div>`.
 * @param targetVelocity - Getter returning pixels-per-second scroll speed.
 * @param seqWidth       - Getter returning the width of one logo sequence (px).
 * @param seqHeight      - Getter returning the height of one logo sequence (px).
 * @param isHovered      - Getter returning whether the track is hovered.
 * @param hoverSpeed     - Getter returning the override speed while hovered.
 * @param isVertical     - Getter returning whether the carousel scrolls vertically.
 */
export function useAnimationLoop(
  trackRef: Ref<HTMLDivElement | null> | ShallowRef<HTMLDivElement | null>,
  targetVelocity: () => number,
  seqWidth: () => number,
  seqHeight: () => number,
  isHovered: () => boolean,
  hoverSpeed: () => number | undefined,
  isVertical: () => boolean,
): void {
  const rafId = ref<number | null>(null);
  const lastTs = ref<number | null>(null);
  const offset = ref(0);
  const velocity = ref(0);

  watch(
    () => [
      targetVelocity(),
      seqWidth(),
      seqHeight(),
      isHovered(),
      hoverSpeed(),
      isVertical(),
    ],
    (_value, _oldValue, onCleanup) => {
      const track = trackRef.value;
      if (!track) return;

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      const vertical = isVertical();
      const seqSize = vertical ? seqHeight() : seqWidth();

      if (seqSize > 0) {
        offset.value = ((offset.value % seqSize) + seqSize) % seqSize;
        track.style.transform = vertical
          ? `translate3d(0, ${-offset.value}px, 0)`
          : `translate3d(${-offset.value}px, 0, 0)`;
      }

      if (prefersReduced) {
        track.style.transform = "translate3d(0, 0, 0)";
        onCleanup(() => {
          lastTs.value = null;
        });
        return;
      }

      const animate = (ts: number) => {
        if (lastTs.value === null) lastTs.value = ts;
        const dt = Math.max(0, ts - lastTs.value) / 1000;
        lastTs.value = ts;

        const hs = hoverSpeed();
        const target =
          isHovered() && hs !== undefined ? hs : targetVelocity();
        const ease = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
        velocity.value += (target - velocity.value) * ease;

        if (seqSize > 0) {
          let next = offset.value + velocity.value * dt;
          next = ((next % seqSize) + seqSize) % seqSize;
          offset.value = next;
          track.style.transform = vertical
            ? `translate3d(0, ${-offset.value}px, 0)`
            : `translate3d(${-offset.value}px, 0, 0)`;
        }

        rafId.value = requestAnimationFrame(animate);
      };

      rafId.value = requestAnimationFrame(animate);

      onCleanup(() => {
        if (rafId.value !== null) {
          cancelAnimationFrame(rafId.value);
          rafId.value = null;
        }
        lastTs.value = null;
      });
    },
    { immediate: true },
  );

  onUnmounted(() => {
    if (rafId.value !== null) {
      cancelAnimationFrame(rafId.value);
      rafId.value = null;
    }
  });
}
