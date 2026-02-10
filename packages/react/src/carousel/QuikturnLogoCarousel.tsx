import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { logoUrl } from "@quikturn/logos";
import { useQuikturnContext } from "../context";
import { fireBeacon } from "../beacon";
import {
  ANIMATION_CONFIG,
  useResizeObserver,
  useImageLoader,
  useAnimationLoop,
} from "./hooks";
import type {
  QuikturnLogoCarouselProps,
  LogoConfig,
  ResolvedLogo,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCssLength(value?: number | string): string | undefined {
  return typeof value === "number" ? `${value}px` : (value ?? undefined);
}

// ---------------------------------------------------------------------------
// Fade overlays
// ---------------------------------------------------------------------------

function FadeOverlays({
  isVertical,
  fadeColor = "#ffffff",
}: {
  isVertical: boolean;
  fadeColor?: string;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 1,
  };

  if (isVertical) {
    return (
      <>
        <div
          aria-hidden="true"
          data-testid="fade-overlay"
          style={{
            ...base,
            top: 0,
            left: 0,
            right: 0,
            height: "clamp(24px, 8%, 120px)",
            background: `linear-gradient(to bottom, ${fadeColor} 0%, transparent 100%)`,
          }}
        />
        <div
          aria-hidden="true"
          data-testid="fade-overlay"
          style={{
            ...base,
            bottom: 0,
            left: 0,
            right: 0,
            height: "clamp(24px, 8%, 120px)",
            background: `linear-gradient(to top, ${fadeColor} 0%, transparent 100%)`,
          }}
        />
      </>
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        style={{
          ...base,
          top: 0,
          bottom: 0,
          left: 0,
          width: "clamp(24px, 8%, 120px)",
          background: `linear-gradient(to right, ${fadeColor} 0%, transparent 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        style={{
          ...base,
          top: 0,
          bottom: 0,
          right: 0,
          width: "clamp(24px, 8%, 120px)",
          background: `linear-gradient(to left, ${fadeColor} 0%, transparent 100%)`,
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Default logo item renderer
// ---------------------------------------------------------------------------

function DefaultLogoItem({
  logo,
  logoHeight,
  scaleOnHover,
}: {
  logo: ResolvedLogo;
  logoHeight: number;
  scaleOnHover: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const imgStyle: React.CSSProperties = {
    height: `${logoHeight}px`,
    width: "auto",
    display: "block",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
    transform: scaleOnHover && hovered ? "scale(1.2)" : undefined,
    transition: scaleOnHover
      ? "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)"
      : undefined,
  };

  const handlers = scaleOnHover
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};

  const img = (
    <img
      src={logo.url}
      alt={logo.alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={imgStyle}
    />
  );

  if (logo.href) {
    return (
      <a
        href={logo.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={logo.alt}
        style={{
          display: "inline-flex",
          alignItems: "center",
          textDecoration: "none",
        }}
        {...handlers}
      >
        {img}
      </a>
    );
  }

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center" }}
      {...handlers}
    >
      {img}
    </span>
  );
}

// ---------------------------------------------------------------------------
// QuikturnLogoCarousel
// ---------------------------------------------------------------------------

export const QuikturnLogoCarousel = React.memo<QuikturnLogoCarouselProps>(
  function QuikturnLogoCarousel({
    domains,
    logos,
    token,
    baseUrl,
    speed = 120,
    direction = "left",
    pauseOnHover,
    hoverSpeed,
    logoHeight = 28,
    gap = 32,
    width = "100%",
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    logoSize,
    logoFormat,
    logoGreyscale,
    logoTheme,
    renderItem,
    className,
    style,
    ariaLabel = "Company logos",
  }) {
    const ctx = useQuikturnContext();
    const effectiveToken = token ?? ctx?.token ?? "";
    const effectiveBaseUrl = baseUrl ?? ctx?.baseUrl;

    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const seqRef = useRef<HTMLUListElement>(null);

    const [seqWidth, setSeqWidth] = useState(0);
    const [seqHeight, setSeqHeight] = useState(0);
    const [copyCount, setCopyCount] = useState<number>(ANIMATION_CONFIG.MIN_COPIES);
    const [isHovered, setIsHovered] = useState(false);

    const isVertical = direction === "up" || direction === "down";

    // Resolve logos
    const resolvedLogos: ResolvedLogo[] = useMemo(() => {
      const items: LogoConfig[] =
        logos ?? (domains ?? []).map((d) => ({ domain: d }));
      return items.map((item) => ({
        domain: item.domain,
        alt: item.alt ?? `${item.domain} logo`,
        href: item.href,
        url: logoUrl(item.domain, {
          token: effectiveToken || undefined,
          size: item.size ?? logoSize,
          format: item.format ?? logoFormat,
          greyscale: item.greyscale ?? logoGreyscale,
          theme: item.theme ?? logoTheme,
          baseUrl: effectiveBaseUrl,
        }),
      }));
    }, [
      domains,
      logos,
      effectiveToken,
      effectiveBaseUrl,
      logoSize,
      logoFormat,
      logoGreyscale,
      logoTheme,
    ]);

    // Beacon
    useEffect(() => {
      if (effectiveToken) fireBeacon(effectiveToken);
    }, [effectiveToken]);

    // Hover speed resolution
    const effectiveHoverSpeed = useMemo(() => {
      if (hoverSpeed !== undefined) return hoverSpeed;
      if (pauseOnHover === true) return 0;
      return undefined;
    }, [hoverSpeed, pauseOnHover]);

    // Target velocity
    const targetVelocity = useMemo(() => {
      const mag = Math.abs(speed);
      const dirMul = isVertical
        ? direction === "up"
          ? 1
          : -1
        : direction === "left"
          ? 1
          : -1;
      const signMul = speed < 0 ? -1 : 1;
      return mag * dirMul * signMul;
    }, [speed, direction, isVertical]);

    // Dimension update
    const updateDimensions = useCallback(() => {
      const containerEl = containerRef.current;
      const seqRect = seqRef.current?.getBoundingClientRect();
      const sw = seqRect?.width ?? 0;
      const sh = seqRect?.height ?? 0;

      if (isVertical) {
        const parentH = containerEl?.parentElement?.clientHeight ?? 0;
        if (containerEl && parentH > 0) {
          containerEl.style.height = `${Math.ceil(parentH)}px`;
        }
        if (sh > 0) {
          setSeqHeight(Math.ceil(sh));
          const viewport = containerEl?.clientHeight ?? parentH ?? sh;
          const copies =
            Math.ceil(viewport / sh) + ANIMATION_CONFIG.COPY_HEADROOM;
          setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copies));
        }
      } else if (sw > 0) {
        setSeqWidth(Math.ceil(sw));
        const containerW = containerEl?.clientWidth ?? 0;
        const copies =
          Math.ceil(containerW / sw) + ANIMATION_CONFIG.COPY_HEADROOM;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copies));
      }
    }, [isVertical]);

    useResizeObserver(updateDimensions, [containerRef, seqRef], [
      resolvedLogos,
      gap,
      logoHeight,
      isVertical,
    ]);

    useImageLoader(seqRef, updateDimensions, [
      resolvedLogos,
      gap,
      logoHeight,
      isVertical,
    ]);

    useAnimationLoop(
      trackRef,
      targetVelocity,
      seqWidth,
      seqHeight,
      isHovered,
      effectiveHoverSpeed,
      isVertical,
    );

    const handleMouseEnter = useCallback(() => {
      if (effectiveHoverSpeed !== undefined) setIsHovered(true);
    }, [effectiveHoverSpeed]);

    const handleMouseLeave = useCallback(() => {
      if (effectiveHoverSpeed !== undefined) setIsHovered(false);
    }, [effectiveHoverSpeed]);

    // Render copies
    const logoLists = useMemo(
      () =>
        Array.from({ length: copyCount }, (_, ci) => (
          <ul
            key={ci}
            ref={ci === 0 ? seqRef : undefined}
            role="list"
            aria-hidden={ci > 0 ? true : undefined}
            style={{
              display: "flex",
              flexDirection: isVertical ? "column" : "row",
              alignItems: "center",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {resolvedLogos.map((logo, i) => (
              <li
                key={`${ci}-${i}`}
                role="listitem"
                style={{
                  flex: "none",
                  ...(isVertical
                    ? { marginBottom: `${gap}px` }
                    : { marginRight: `${gap}px` }),
                }}
              >
                {renderItem ? (
                  renderItem(logo, i)
                ) : (
                  <DefaultLogoItem
                    logo={logo}
                    logoHeight={logoHeight}
                    scaleOnHover={scaleOnHover}
                  />
                )}
              </li>
            ))}
          </ul>
        )),
      [
        copyCount,
        resolvedLogos,
        isVertical,
        gap,
        logoHeight,
        scaleOnHover,
        renderItem,
      ],
    );

    const cssWidth = toCssLength(width);

    return (
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        className={className}
        style={{
          position: "relative",
          overflow: "hidden",
          width: isVertical ? undefined : (cssWidth ?? "100%"),
          height: isVertical ? "100%" : undefined,
          display: isVertical ? "inline-block" : undefined,
          ...style,
        }}
      >
        {fadeOut && (
          <FadeOverlays isVertical={isVertical} fadeColor={fadeOutColor} />
        )}
        <div
          ref={trackRef}
          style={{
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            width: isVertical ? "100%" : "max-content",
            willChange: "transform",
            userSelect: "none",
            position: "relative",
            zIndex: 0,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {logoLists}
        </div>
      </div>
    );
  },
);
