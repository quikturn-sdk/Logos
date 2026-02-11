<script lang="ts">
  import { createLogoUrl } from "../../src/lib/createLogoUrl.svelte.js";
  import type { LogoOptions } from "../../src/lib/types.js";

  let {
    domain,
    token = undefined,
    baseUrl = undefined,
    size = undefined,
    format = undefined,
    greyscale = undefined,
    theme = undefined,
  }: {
    domain: string;
    token?: string;
    baseUrl?: string;
    size?: number;
    format?: LogoOptions["format"];
    greyscale?: boolean;
    theme?: LogoOptions["theme"];
  } = $props();

  const logo = createLogoUrl(
    () => domain,
    () => {
      const opts: LogoOptions & { token?: string; baseUrl?: string } = {};
      if (token !== undefined) opts.token = token;
      if (baseUrl !== undefined) opts.baseUrl = baseUrl;
      if (size !== undefined) opts.size = size;
      if (format !== undefined) opts.format = format;
      if (greyscale !== undefined) opts.greyscale = greyscale;
      if (theme !== undefined) opts.theme = theme;
      return Object.keys(opts).length > 0 ? opts : undefined;
    },
  );
</script>

<div data-testid="url">{logo.url}</div>
