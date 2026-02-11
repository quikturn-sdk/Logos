<script lang="ts">
  import type { Snippet } from "svelte";
  import { setQuikturnContext } from "./context.svelte.js";

  let { token, baseUrl, children }: { token: string; baseUrl?: string; children: Snippet } = $props();
  setQuikturnContext(() => token, () => baseUrl);
</script>

{@render children()}
