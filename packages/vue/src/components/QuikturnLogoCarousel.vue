<script setup lang="ts">
import { computed, ref, onMounted, type CSSProperties } from "vue";
import { logoUrl } from "@quikturn/logos";
import { useQuikturnContext } from "../composables/useQuikturnContext";
import { fireBeacon } from "../beacon";
import { isValidHref } from "../validate-href";
import {
  ANIMATION_CONFIG,
  useResizeObserver,
  useImageLoader,
  useAnimationLoop,
} from "../carousel/hooks";
import type {
  LogoConfig,
  ResolvedLogo,
  QuikturnLogoCarouselProps,
} from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    QuikturnLogoCarouselProps & {
      class?: string;
      style?: CSSProperties;
    }
  >(),
  {
    speed: 120,
    direction: "left",
    pauseOnHover: undefined,
    hoverSpeed: undefined,
    logoHeight: 28,
    gap: 32,
    width: "100%",
    fadeOut: false,
    fadeOutColor: undefined,
    scaleOnHover: false,
    logoSize: undefined,
    logoFormat: undefined,
    logoGreyscale: undefined,
    logoTheme: undefined,
    logoVariant: undefined,
    renderItem: undefined,
    ariaLabel: "Company logos",
    token: undefined,
    baseUrl: undefined,
    domains: undefined,
    logos: undefined,
  },
);

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ctx = useQuikturnContext();
const effectiveToken = computed(() => props.token ?? ctx?.token ?? "");
const effectiveBaseUrl = computed(() => props.baseUrl ?? ctx?.baseUrl);

// ---------------------------------------------------------------------------
// Template refs
// ---------------------------------------------------------------------------

const containerRef = ref<HTMLDivElement | null>(null);
const trackRef = ref<HTMLDivElement | null>(null);
const seqRef = ref<HTMLUListElement | null>(null);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const seqWidth = ref(0);
const seqHeight = ref(0);
const copyCount = ref<number>(ANIMATION_CONFIG.MIN_COPIES);
const isHovered = ref(false);

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

const isVertical = computed(
  () => props.direction === "up" || props.direction === "down",
);

const resolvedLogos = computed<ResolvedLogo[]>(() => {
  const items: LogoConfig[] =
    props.logos ?? (props.domains ?? []).map((d) => ({ domain: d }));
  return items.map((item) => ({
    domain: item.domain,
    alt: item.alt ?? `${item.domain} logo`,
    href: item.href,
    url: logoUrl(item.domain, {
      token: effectiveToken.value || undefined,
      size: item.size ?? props.logoSize,
      format: item.format ?? props.logoFormat,
      greyscale: item.greyscale ?? props.logoGreyscale,
      theme: item.theme ?? props.logoTheme,
      variant: item.variant ?? props.logoVariant,
      baseUrl: effectiveBaseUrl.value,
    }),
  }));
});

const effectiveHoverSpeed = computed(() => {
  if (props.hoverSpeed !== undefined) return props.hoverSpeed;
  if (props.pauseOnHover === true) return 0;
  return undefined;
});

const targetVelocity = computed(() => {
  const mag = Math.abs(props.speed);
  const dirMul = isVertical.value
    ? props.direction === "up"
      ? 1
      : -1
    : props.direction === "left"
      ? 1
      : -1;
  const signMul = props.speed < 0 ? -1 : 1;
  return mag * dirMul * signMul;
});

const cssWidth = computed(() => {
  const w = props.width;
  return typeof w === "number" ? `${w}px` : (w ?? undefined);
});

const containerStyle = computed<CSSProperties>(() => ({
  position: "relative",
  overflow: "hidden",
  width: isVertical.value ? undefined : (cssWidth.value ?? "100%"),
  height: isVertical.value ? "100%" : undefined,
  display: isVertical.value ? "inline-block" : undefined,
}));

const trackStyle = computed<CSSProperties>(() => ({
  display: "flex",
  flexDirection: isVertical.value ? "column" : "row",
  width: isVertical.value ? "100%" : "max-content",
  willChange: "transform",
  userSelect: "none",
  position: "relative",
  zIndex: 0,
}));

const copies = computed(() =>
  Array.from({ length: copyCount.value }, (_, i) => i),
);

// ---------------------------------------------------------------------------
// Beacon
// ---------------------------------------------------------------------------

onMounted(() => {
  if (effectiveToken.value) fireBeacon(effectiveToken.value);
});

// ---------------------------------------------------------------------------
// Dimension measurement
// ---------------------------------------------------------------------------

function updateDimensions(): void {
  const containerEl = containerRef.value;
  const seqRect = seqRef.value?.getBoundingClientRect();
  const sw = seqRect?.width ?? 0;
  const sh = seqRect?.height ?? 0;

  if (isVertical.value) {
    const parentH = containerEl?.parentElement?.clientHeight ?? 0;
    if (containerEl && parentH > 0) {
      containerEl.style.height = `${Math.ceil(parentH)}px`;
    }
    if (sh > 0) {
      seqHeight.value = Math.ceil(sh);
      const viewport = containerEl?.clientHeight ?? parentH ?? sh;
      const copies =
        Math.ceil(viewport / sh) + ANIMATION_CONFIG.COPY_HEADROOM;
      copyCount.value = Math.max(ANIMATION_CONFIG.MIN_COPIES, copies);
    }
  } else if (sw > 0) {
    seqWidth.value = Math.ceil(sw);
    const containerW = containerEl?.clientWidth ?? 0;
    const copies =
      Math.ceil(containerW / sw) + ANIMATION_CONFIG.COPY_HEADROOM;
    copyCount.value = Math.max(ANIMATION_CONFIG.MIN_COPIES, copies);
  }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

useResizeObserver(updateDimensions, [containerRef, seqRef], () => [
  resolvedLogos.value,
  props.gap,
  props.logoHeight,
  isVertical.value,
]);

useImageLoader(seqRef, updateDimensions, () => [
  resolvedLogos.value,
  props.gap,
  props.logoHeight,
  isVertical.value,
]);

useAnimationLoop(
  trackRef,
  () => targetVelocity.value,
  () => seqWidth.value,
  () => seqHeight.value,
  () => isHovered.value,
  () => effectiveHoverSpeed.value,
  () => isVertical.value,
);

// ---------------------------------------------------------------------------
// Hover handlers
// ---------------------------------------------------------------------------

function handleMouseEnter(): void {
  if (effectiveHoverSpeed.value !== undefined) isHovered.value = true;
}

function handleMouseLeave(): void {
  if (effectiveHoverSpeed.value !== undefined) isHovered.value = false;
}

// ---------------------------------------------------------------------------
// Fade overlay styles
// ---------------------------------------------------------------------------

const fadeBaseStyle: CSSProperties = {
  position: "absolute",
  pointerEvents: "none",
  zIndex: 1,
};

function fadeStartStyle(): CSSProperties {
  const color = props.fadeOutColor ?? "#ffffff";
  if (isVertical.value) {
    return {
      ...fadeBaseStyle,
      top: "0",
      left: "0",
      right: "0",
      height: "clamp(24px, 8%, 120px)",
      background: `linear-gradient(to bottom, ${color} 0%, transparent 100%)`,
    };
  }
  return {
    ...fadeBaseStyle,
    top: "0",
    bottom: "0",
    left: "0",
    width: "clamp(24px, 8%, 120px)",
    background: `linear-gradient(to right, ${color} 0%, transparent 100%)`,
  };
}

function fadeEndStyle(): CSSProperties {
  const color = props.fadeOutColor ?? "#ffffff";
  if (isVertical.value) {
    return {
      ...fadeBaseStyle,
      bottom: "0",
      left: "0",
      right: "0",
      height: "clamp(24px, 8%, 120px)",
      background: `linear-gradient(to top, ${color} 0%, transparent 100%)`,
    };
  }
  return {
    ...fadeBaseStyle,
    top: "0",
    bottom: "0",
    right: "0",
    width: "clamp(24px, 8%, 120px)",
    background: `linear-gradient(to left, ${color} 0%, transparent 100%)`,
  };
}

// ---------------------------------------------------------------------------
// Logo item styles
// ---------------------------------------------------------------------------

function imgStyle(): CSSProperties {
  return {
    height: `${props.logoHeight}px`,
    width: "auto",
    display: "block",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
    ...(props.scaleOnHover
      ? { transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)" }
      : {}),
  };
}

function handleItemMouseEnter(event: MouseEvent): void {
  if (!props.scaleOnHover) return;
  const li = (event.currentTarget as HTMLElement).closest("li");
  const img = li?.querySelector("img");
  if (img) img.style.transform = "scale(1.2)";
}

function handleItemMouseLeave(event: MouseEvent): void {
  if (!props.scaleOnHover) return;
  const li = (event.currentTarget as HTMLElement).closest("li");
  const img = li?.querySelector("img");
  if (img) img.style.transform = "";
}

function liStyle(): CSSProperties {
  return {
    flex: "none",
    ...(isVertical.value
      ? { marginBottom: `${props.gap}px` }
      : { marginRight: `${props.gap}px` }),
  };
}

function listStyle(): CSSProperties {
  return {
    display: "flex",
    flexDirection: isVertical.value ? "column" : "row",
    alignItems: "center",
    listStyle: "none",
    margin: "0",
    padding: "0",
  };
}
</script>

<template>
  <div
    ref="containerRef"
    role="region"
    :aria-label="ariaLabel"
    :class="$props.class"
    :style="[containerStyle, $props.style]"
  >
    <!-- Fade overlays -->
    <template v-if="fadeOut">
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        :style="fadeStartStyle()"
      />
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        :style="fadeEndStyle()"
      />
    </template>

    <!-- Scrolling track -->
    <div
      ref="trackRef"
      :style="trackStyle"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <ul
        v-for="ci in copies"
        :key="ci"
        :ref="(el) => { if (ci === 0) seqRef = el as HTMLUListElement | null; }"
        role="list"
        :aria-hidden="ci > 0 ? true : undefined"
        :style="listStyle()"
      >
        <li
          v-for="(logo, i) in resolvedLogos"
          :key="`${ci}-${i}`"
          role="listitem"
          :style="liStyle()"
        >
          <!-- Custom render item -->
          <template v-if="renderItem">
            <component :is="() => renderItem!(logo, i)" />
          </template>
          <!-- Default logo item -->
          <template v-else>
            <a
              v-if="logo.href && isValidHref(logo.href)"
              :href="logo.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="logo.alt"
              style="display: inline-flex; align-items: center; text-decoration: none"
              @mouseenter="handleItemMouseEnter"
              @mouseleave="handleItemMouseLeave"
            >
              <img
                :src="logo.url"
                :alt="logo.alt"
                loading="lazy"
                decoding="async"
                :draggable="false"
                :style="imgStyle()"
              />
            </a>
            <span
              v-else
              style="display: inline-flex; align-items: center"
              @mouseenter="handleItemMouseEnter"
              @mouseleave="handleItemMouseLeave"
            >
              <img
                :src="logo.url"
                :alt="logo.alt"
                loading="lazy"
                decoding="async"
                :draggable="false"
                :style="imgStyle()"
              />
            </span>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>
