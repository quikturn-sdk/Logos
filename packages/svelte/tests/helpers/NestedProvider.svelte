<script lang="ts">
  import QuikturnProvider from "../../src/lib/QuikturnProvider.svelte";
  import ContextConsumer from "./ContextConsumer.svelte";

  let {
    outerToken,
    innerToken,
  }: {
    outerToken: string;
    innerToken: string;
  } = $props();
</script>

<QuikturnProvider token={outerToken}>
  <QuikturnProvider token={innerToken}>
    <ContextConsumer />
  </QuikturnProvider>
</QuikturnProvider>
