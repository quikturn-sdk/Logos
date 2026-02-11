<script lang="ts">
  import QuikturnProvider from "../../src/lib/QuikturnProvider.svelte";
  import CreateLogoUrlConsumer from "./CreateLogoUrlConsumer.svelte";
  import type { LogoOptions } from "../../src/lib/types.js";

  let {
    providerToken,
    providerBaseUrl = undefined,
    domain,
    token = undefined,
    baseUrl = undefined,
    size = undefined,
    format = undefined,
    greyscale = undefined,
    theme = undefined,
  }: {
    providerToken: string;
    providerBaseUrl?: string;
    domain: string;
    token?: string;
    baseUrl?: string;
    size?: number;
    format?: LogoOptions["format"];
    greyscale?: boolean;
    theme?: LogoOptions["theme"];
  } = $props();
</script>

<QuikturnProvider token={providerToken} baseUrl={providerBaseUrl}>
  <CreateLogoUrlConsumer {domain} {token} {baseUrl} {size} {format} {greyscale} {theme} />
</QuikturnProvider>
