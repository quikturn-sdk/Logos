<script setup lang="ts">
import { computed, onMounted, type CSSProperties, type VNode } from "vue";
import { logoUrl } from "@quikturn/logos";
import type { SupportedOutputFormat, ThemeOption } from "@quikturn/logos";
import { useQuikturnContext } from "../composables/useQuikturnContext";
import { fireBeacon } from "../beacon";
import { isValidHref } from "../validate-href";
import type { LogoConfig, ResolvedLogo } from "../types";

const props = withDefaults(
  defineProps<{
    domains?: string[];
    logos?: LogoConfig[];
    token?: string;
    baseUrl?: string;
    columns?: number;
    gap?: number;
    logoSize?: number;
    logoFormat?: string;
    logoGreyscale?: boolean;
    logoTheme?: string;
    renderItem?: (logo: ResolvedLogo, index: number) => VNode;
    class?: string;
    style?: CSSProperties;
    ariaLabel?: string;
  }>(),
  { columns: 4, gap: 24, ariaLabel: "Company logos" },
);

const ctx = useQuikturnContext();
const effectiveToken = computed(() => props.token ?? ctx?.token ?? "");
const effectiveBaseUrl = computed(() => props.baseUrl ?? ctx?.baseUrl);

const resolvedLogos = computed<ResolvedLogo[]>(() => {
  const items: LogoConfig[] =
    props.logos ?? (props.domains ?? []).map((d) => ({ domain: d }));
  return items.map((item) => ({
    domain: item.domain,
    alt: item.alt ?? `${item.domain} logo`,
    href: item.href,
    url: logoUrl(item.domain, {
      token: effectiveToken.value || undefined,
      size: item.size ?? props.logoSize,
      format: (item.format ?? props.logoFormat) as SupportedOutputFormat | undefined,
      greyscale: item.greyscale ?? props.logoGreyscale,
      theme: (item.theme ?? props.logoTheme) as ThemeOption | undefined,
      baseUrl: effectiveBaseUrl.value,
    }),
  }));
});

const gridStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gap: `${props.gap}px`,
  alignItems: "center",
  justifyItems: "center",
  ...(props.style ?? {}),
}));

onMounted(() => {
  if (effectiveToken.value) fireBeacon(effectiveToken.value);
});
</script>

<template>
  <div role="region" :aria-label="ariaLabel" :class="props.class" :style="gridStyle">
    <template v-for="(logo, i) in resolvedLogos" :key="logo.domain">
      <component :is="renderItem!(logo, i)" v-if="renderItem" />
      <div
        v-else
        :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center' }"
      >
        <a
          v-if="logo.href && isValidHref(logo.href)"
          :href="logo.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="logo.alt"
        >
          <img
            :src="logo.url"
            :alt="logo.alt"
            loading="lazy"
            :style="{ maxWidth: '100%', height: 'auto', display: 'block' }"
          />
        </a>
        <img
          v-else
          :src="logo.url"
          :alt="logo.alt"
          loading="lazy"
          :style="{ maxWidth: '100%', height: 'auto', display: 'block' }"
        />
      </div>
    </template>
  </div>
</template>
