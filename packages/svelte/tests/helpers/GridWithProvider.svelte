<script lang="ts">
  import QuikturnProvider from "../../src/lib/QuikturnProvider.svelte";
  import QuikturnLogoGrid from "../../src/lib/QuikturnLogoGrid.svelte";

  let { token, baseUrl, ...rest }: {
    token: string;
    baseUrl?: string;
    domains?: string[];
    [key: string]: unknown;
  } = $props();
</script>

<QuikturnProvider {token} {baseUrl}>
  <QuikturnLogoGrid {...rest} />
</QuikturnProvider>
