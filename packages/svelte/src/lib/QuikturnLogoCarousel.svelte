<script lang="ts">
  import { logoUrl } from "@quikturn/logos";
  import { getQuikturnContext } from "./context.svelte.js";
  import { fireBeacon } from "./beacon.js";
  import { isValidHref } from "./validate-href.js";
  import {
    ANIMATION_CONFIG,
    createResizeObserver,
    createImageLoader,
    createAnimationLoop,
  } from "./carousel/animation.svelte.js";
  import type {
    QuikturnLogoCarouselProps,
    LogoConfig,
    ResolvedLogo,
  } from "./types.js";
  import { onMount, onDestroy } from "svelte";

  let {
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
    fadeOutColor = "#ffffff",
    scaleOnHover = false,
    logoSize,
    logoFormat,
    logoGreyscale,
    logoTheme,
    logoVariant,
    renderItem,
    class: className,
    style,
    ariaLabel = "Company logos",
  }: QuikturnLogoCarouselProps = $props();

  // ---------------------------------------------------------------------------
  // Context
  // ---------------------------------------------------------------------------

  const ctx = getQuikturnContext();
  const effectiveToken = $derived(token ?? ctx?.token ?? "");
  const effectiveBaseUrl = $derived(baseUrl ?? ctx?.baseUrl);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const isVertical = $derived(direction === "up" || direction === "down");

  const resolvedLogos: ResolvedLogo[] = $derived.by(() => {
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
        variant: item.variant ?? logoVariant,
        baseUrl: effectiveBaseUrl,
      }),
    }));
  });

  const effectiveHoverSpeed = $derived.by(() => {
    if (hoverSpeed !== undefined) return hoverSpeed;
    if (pauseOnHover === true) return 0;
    return undefined;
  });

  const targetVelocity = $derived.by(() => {
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
  });

  const cssWidth = $derived(
    typeof width === "number" ? `${width}px` : (width ?? "100%"),
  );

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let seqWidth = $state(0);
  let seqHeight = $state(0);
  let copyCount: number = $state(ANIMATION_CONFIG.MIN_COPIES);
  let isHovered = $state(false);

  // Element bindings
  let containerEl: HTMLDivElement | undefined = $state(undefined);
  let trackEl: HTMLDivElement | undefined = $state(undefined);
  let seqEl: HTMLUListElement | undefined = $state(undefined);

  // Copy indices array for {#each}
  const copyIndices = $derived(Array.from({ length: copyCount }, (_, i) => i));

  /** Action to capture the first <ul> as the sequence measurement reference. */
  function captureSeqRef(node: HTMLUListElement, isFirst: boolean) {
    if (isFirst) seqEl = node;
  }

  // ---------------------------------------------------------------------------
  // Dimension measurement
  // ---------------------------------------------------------------------------

  function updateDimensions() {
    const seqRect = seqEl?.getBoundingClientRect();
    const sw = seqRect?.width ?? 0;
    const sh = seqRect?.height ?? 0;

    if (isVertical) {
      const parentH = containerEl?.parentElement?.clientHeight ?? 0;
      if (containerEl && parentH > 0) {
        containerEl.style.height = `${Math.ceil(parentH)}px`;
      }
      if (sh > 0) {
        seqHeight = Math.ceil(sh);
        const viewport = containerEl?.clientHeight ?? parentH ?? sh;
        const copies =
          Math.ceil(viewport / sh) + ANIMATION_CONFIG.COPY_HEADROOM;
        copyCount = Math.max(ANIMATION_CONFIG.MIN_COPIES, copies);
      }
    } else if (sw > 0) {
      seqWidth = Math.ceil(sw);
      const containerW = containerEl?.clientWidth ?? 0;
      const copies =
        Math.ceil(containerW / sw) + ANIMATION_CONFIG.COPY_HEADROOM;
      copyCount = Math.max(ANIMATION_CONFIG.MIN_COPIES, copies);
    }
  }

  // ---------------------------------------------------------------------------
  // Hover handlers
  // ---------------------------------------------------------------------------

  function handleMouseEnter() {
    if (effectiveHoverSpeed !== undefined) isHovered = true;
  }

  function handleMouseLeave() {
    if (effectiveHoverSpeed !== undefined) isHovered = false;
  }

  function handleItemMouseEnter(event: MouseEvent) {
    if (!scaleOnHover) return;
    const target = event.currentTarget as HTMLElement;
    const img = target.querySelector("img");
    if (img) img.style.transform = "scale(1.2)";
  }

  function handleItemMouseLeave(event: MouseEvent) {
    if (!scaleOnHover) return;
    const target = event.currentTarget as HTMLElement;
    const img = target.querySelector("img");
    if (img) img.style.transform = "";
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  let resizeCleanup: { destroy(): void } | null = null;
  let imageCleanup: { destroy(): void } | null = null;
  let animCleanup: { destroy(): void } | null = null;

  onMount(() => {
    // Fire attribution beacon
    if (effectiveToken) fireBeacon(effectiveToken);

    // Resize observer
    resizeCleanup = createResizeObserver(updateDimensions, () => [
      containerEl ?? null,
      seqEl ?? null,
    ]);

    // Image loader
    imageCleanup = createImageLoader(
      () => seqEl ?? null,
      updateDimensions,
    );

    // Animation loop
    animCleanup = createAnimationLoop(
      () => trackEl ?? null,
      () => targetVelocity,
      () => seqWidth,
      () => seqHeight,
      () => isHovered,
      () => effectiveHoverSpeed,
      () => isVertical,
    );
  });

  onDestroy(() => {
    resizeCleanup?.destroy();
    imageCleanup?.destroy();
    animCleanup?.destroy();
  });
</script>

<!-- Container -->
<div
  bind:this={containerEl}
  role="region"
  aria-label={ariaLabel}
  class={className}
  {style}
  style:position="relative"
  style:overflow="hidden"
  style:width={isVertical ? undefined : cssWidth}
  style:height={isVertical ? "100%" : undefined}
  style:display={isVertical ? "inline-block" : undefined}
>
  <!-- Fade overlays -->
  {#if fadeOut}
    {#if isVertical}
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        style:position="absolute"
        style:pointer-events="none"
        style:z-index="1"
        style:top="0"
        style:left="0"
        style:right="0"
        style:height="clamp(24px, 8%, 120px)"
        style:background="linear-gradient(to bottom, {fadeOutColor} 0%, transparent 100%)"
      ></div>
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        style:position="absolute"
        style:pointer-events="none"
        style:z-index="1"
        style:bottom="0"
        style:left="0"
        style:right="0"
        style:height="clamp(24px, 8%, 120px)"
        style:background="linear-gradient(to top, {fadeOutColor} 0%, transparent 100%)"
      ></div>
    {:else}
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        style:position="absolute"
        style:pointer-events="none"
        style:z-index="1"
        style:top="0"
        style:bottom="0"
        style:left="0"
        style:width="clamp(24px, 8%, 120px)"
        style:background="linear-gradient(to right, {fadeOutColor} 0%, transparent 100%)"
      ></div>
      <div
        aria-hidden="true"
        data-testid="fade-overlay"
        style:position="absolute"
        style:pointer-events="none"
        style:z-index="1"
        style:top="0"
        style:bottom="0"
        style:right="0"
        style:width="clamp(24px, 8%, 120px)"
        style:background="linear-gradient(to left, {fadeOutColor} 0%, transparent 100%)"
      ></div>
    {/if}
  {/if}

  <!-- Track -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={trackEl}
    style:display="flex"
    style:flex-direction={isVertical ? "column" : "row"}
    style:width={isVertical ? "100%" : "max-content"}
    style:will-change="transform"
    style:user-select="none"
    style:position="relative"
    style:z-index="0"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
  >
    {#each copyIndices as ci (ci)}
      <ul
        use:captureSeqRef={ci === 0}
        role="list"
        aria-hidden={ci > 0 ? "true" : undefined}
        style:display="flex"
        style:flex-direction={isVertical ? "column" : "row"}
        style:align-items="center"
        style:list-style="none"
        style:margin="0"
        style:padding="0"
      >
        {#each resolvedLogos as logo, i (logo.domain + "-" + ci + "-" + i)}
          <li
            role="listitem"
            style:flex="none"
            style:margin-right={isVertical ? undefined : `${gap}px`}
            style:margin-bottom={isVertical ? `${gap}px` : undefined}
          >
            {#if renderItem}
              {@render renderItem(logo, i)}
            {:else if logo.href && isValidHref(logo.href)}
              <a
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={logo.alt}
                style:display="inline-flex"
                style:align-items="center"
                style:text-decoration="none"
                onmouseenter={handleItemMouseEnter}
                onmouseleave={handleItemMouseLeave}
              >
                <img
                  src={logo.url}
                  alt={logo.alt}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  style:height="{logoHeight}px"
                  style:width="auto"
                  style:display="block"
                  style:object-fit="contain"
                  style:user-select="none"
                  style:pointer-events="none"
                  style:transition={scaleOnHover ? "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)" : undefined}
                />
              </a>
            {:else}
              <span
                style:display="inline-flex"
                style:align-items="center"
                onmouseenter={handleItemMouseEnter}
                onmouseleave={handleItemMouseLeave}
              >
                <img
                  src={logo.url}
                  alt={logo.alt}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  style:height="{logoHeight}px"
                  style:width="auto"
                  style:display="block"
                  style:object-fit="contain"
                  style:user-select="none"
                  style:pointer-events="none"
                  style:transition={scaleOnHover ? "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)" : undefined}
                />
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    {/each}
  </div>
</div>
