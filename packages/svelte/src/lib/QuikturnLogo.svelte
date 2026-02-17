<script lang="ts">
  import { logoUrl } from "@quikturn/logos";
  import { getQuikturnContext } from "./context.svelte.js";
  import { fireBeacon } from "./beacon.js";
  import { isValidHref } from "./validate-href.js";
  import type { QuikturnLogoProps } from "./types.js";
  import { onMount } from "svelte";

  let {
    domain,
    token,
    baseUrl,
    size,
    format,
    greyscale,
    theme,
    variant,
    alt,
    href,
    class: className,
    style,
    loading = "lazy",
    onerror,
    onload,
  }: QuikturnLogoProps = $props();

  const ctx = getQuikturnContext();

  const effectiveToken = $derived(token ?? ctx?.token ?? "");
  const effectiveBaseUrl = $derived(baseUrl ?? ctx?.baseUrl);

  const src = $derived(
    logoUrl(domain, {
      token: effectiveToken || undefined,
      size,
      format,
      greyscale,
      theme,
      variant,
      baseUrl: effectiveBaseUrl,
    }),
  );

  const altText = $derived(alt ?? `${domain} logo`);

  onMount(() => {
    if (effectiveToken) fireBeacon(effectiveToken);
  });
</script>

{#if href && isValidHref(href)}
  <a
    {href}
    target="_blank"
    rel="noopener noreferrer"
    class={className}
    {style}
  >
    <img src={src} alt={altText} {loading} {onerror} {onload} />
  </a>
{:else if className || style}
  <span class={className} {style}>
    <img src={src} alt={altText} {loading} {onerror} {onload} />
  </span>
{:else}
  <img src={src} alt={altText} {loading} {onerror} {onload} />
{/if}
