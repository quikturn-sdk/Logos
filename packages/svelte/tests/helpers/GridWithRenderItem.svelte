<script lang="ts">
  import QuikturnLogoGrid from "../../src/lib/QuikturnLogoGrid.svelte";
  import type { ResolvedLogo } from "../../src/lib/types.js";

  let { domains, token }: { domains: string[]; token?: string } = $props();
</script>

<QuikturnLogoGrid {domains} {token}>
  {#snippet renderItem(logo: ResolvedLogo, index: number)}
    <span data-testid="custom-item" data-index={index}>{logo.domain}</span>
  {/snippet}
</QuikturnLogoGrid>
