<script lang="ts">
  import { logoUrl } from "@quikturn/logos";
  import { getQuikturnContext } from "./context.svelte.js";
  import { fireBeacon } from "./beacon.js";
  import { isValidHref } from "./validate-href.js";
  import type { QuikturnLogoGridProps, LogoConfig, ResolvedLogo } from "./types.js";
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";

  let {
    domains,
    logos,
    token,
    baseUrl,
    columns = 4,
    gap = 24,
    logoSize,
    logoFormat,
    logoGreyscale,
    logoTheme,
    renderItem,
    class: className,
    ariaLabel = "Company logos",
  }: QuikturnLogoGridProps = $props();

  const ctx = getQuikturnContext();

  const effectiveToken = $derived(token ?? ctx?.token ?? "");
  const effectiveBaseUrl = $derived(baseUrl ?? ctx?.baseUrl);

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
        baseUrl: effectiveBaseUrl,
      }),
    }));
  });

  const gridStyle = $derived(
    `display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px; align-items: center; justify-items: center;`
  );

  onMount(() => {
    if (effectiveToken) fireBeacon(effectiveToken);
  });
</script>

<div
  role="region"
  aria-label={ariaLabel}
  class={className}
  style={gridStyle}
>
  {#each resolvedLogos as logo, i (logo.domain)}
    {#if renderItem}
      {@render renderItem(logo, i)}
    {:else}
      <div style="display: flex; align-items: center; justify-content: center;">
        {#if logo.href && isValidHref(logo.href)}
          <a
            href={logo.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={logo.alt}
          >
            <img
              src={logo.url}
              alt={logo.alt}
              loading="lazy"
              style="max-width: 100%; height: auto; display: block;"
            />
          </a>
        {:else}
          <img
            src={logo.url}
            alt={logo.alt}
            loading="lazy"
            style="max-width: 100%; height: auto; display: block;"
          />
        {/if}
      </div>
    {/if}
  {/each}
</div>
