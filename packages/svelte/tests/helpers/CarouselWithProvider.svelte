<script lang="ts">
  import QuikturnProvider from "../../src/lib/QuikturnProvider.svelte";
  import QuikturnLogoCarousel from "../../src/lib/QuikturnLogoCarousel.svelte";

  let { token, baseUrl, ...rest }: {
    token: string;
    baseUrl?: string;
    domains?: string[];
    [key: string]: unknown;
  } = $props();
</script>

<QuikturnProvider {token} {baseUrl}>
  <QuikturnLogoCarousel {...rest} />
</QuikturnProvider>
