<script lang="ts">
  import QuikturnProvider from "../../src/lib/QuikturnProvider.svelte";
  import ContextConsumer from "./ContextConsumer.svelte";

  let {
    token,
    baseUrl = undefined,
  }: {
    token: string;
    baseUrl?: string;
  } = $props();
</script>

<QuikturnProvider {token} {baseUrl}>
  <ContextConsumer />
</QuikturnProvider>
