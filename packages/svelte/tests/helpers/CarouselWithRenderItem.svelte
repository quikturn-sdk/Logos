<script lang="ts">
  import QuikturnLogoCarousel from "../../src/lib/QuikturnLogoCarousel.svelte";
  import type { ResolvedLogo } from "../../src/lib/types.js";

  let { domains, onRenderItem, ...rest }: {
    domains?: string[];
    onRenderItem?: (logo: ResolvedLogo, index: number) => void;
    [key: string]: unknown;
  } = $props();
</script>

<QuikturnLogoCarousel {domains} {...rest}>
  {#snippet renderItem(logo: ResolvedLogo, index: number)}
    {@const _ = onRenderItem?.(logo, index)}
    <span data-testid="custom-item">{logo.domain}</span>
  {/snippet}
</QuikturnLogoCarousel>
