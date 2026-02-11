<script lang="ts">
  import QuikturnProvider from "../../src/lib/QuikturnProvider.svelte";
  import QuikturnLogo from "../../src/lib/QuikturnLogo.svelte";

  let { token, baseUrl, domain, ...rest }: {
    token: string;
    baseUrl?: string;
    domain: string;
    [key: string]: unknown;
  } = $props();
</script>

<QuikturnProvider {token} {baseUrl}>
  <QuikturnLogo {domain} {...rest} />
</QuikturnProvider>
