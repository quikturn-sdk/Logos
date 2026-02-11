import { useEffect, useRef } from "react";

export const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2,
} as const;

export function useResizeObserver(
  callback: () => void,
  refs: Array<React.RefObject<Element | null>>,
  deps: React.DependencyList,
): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.ResizeObserver) {
      const handle = () => callback();
      window.addEventListener("resize", handle);
      callback();
      return () => window.removeEventListener("resize", handle);
    }

    const observers = refs.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();

    return () => {
      observers.forEach((o) => o?.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useImageLoader(
  listRef: React.RefObject<HTMLElement | null>,
  onLoad: () => void,
  deps: React.DependencyList,
): void {
  useEffect(() => {
    const images = listRef.current?.querySelectorAll("img") ?? [];
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

    return () => {
      images.forEach((img) => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useAnimationLoop(
  trackRef: React.RefObject<HTMLDivElement | null>,
  targetVelocity: number,
  seqWidth: number,
  seqHeight: number,
  isHovered: boolean,
  hoverSpeed: number | undefined,
  isVertical: boolean,
): void {
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const seqSize = isVertical ? seqHeight : seqWidth;

    if (seqSize > 0) {
      offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
      track.style.transform = isVertical
        ? `translate3d(0, ${-offsetRef.current}px, 0)`
        : `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    if (prefersReduced) {
      track.style.transform = "translate3d(0, 0, 0)";
      return () => {
        lastTsRef.current = null;
      };
    }

    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.max(0, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const target =
        isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;
      const ease = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * ease;

      if (seqSize > 0) {
        let next = offsetRef.current + velocityRef.current * dt;
        next = ((next % seqSize) + seqSize) % seqSize;
        offsetRef.current = next;
        track.style.transform = isVertical
          ? `translate3d(0, ${-offsetRef.current}px, 0)`
          : `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
    };
    // trackRef is a stable React ref — only .current mutates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical]);
}
