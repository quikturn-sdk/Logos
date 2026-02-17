<script setup lang="ts">
import { computed, onMounted, type CSSProperties } from "vue";
import { logoUrl } from "@quikturn/logos";
import type { SupportedOutputFormat, ThemeOption, LogoVariant } from "@quikturn/logos";
import { useQuikturnContext } from "../composables/useQuikturnContext";
import { fireBeacon } from "../beacon";
import { isValidHref } from "../validate-href";

const props = withDefaults(
  defineProps<{
    domain: string;
    token?: string;
    baseUrl?: string;
    size?: number;
    format?: string;
    greyscale?: boolean;
    theme?: string;
    variant?: string;
    alt?: string;
    href?: string;
    class?: string;
    style?: CSSProperties;
    loading?: "lazy" | "eager";
  }>(),
  { loading: "lazy" },
);

const emit = defineEmits<{
  error: [event: Event];
  load: [event: Event];
}>();

const ctx = useQuikturnContext();
const effectiveToken = computed(() => props.token ?? ctx?.token ?? "");
const effectiveBaseUrl = computed(() => props.baseUrl ?? ctx?.baseUrl);

const src = computed(() =>
  logoUrl(props.domain, {
    token: effectiveToken.value || undefined,
    size: props.size,
    format: props.format as SupportedOutputFormat | undefined,
    greyscale: props.greyscale,
    theme: props.theme as ThemeOption | undefined,
    variant: props.variant as LogoVariant | undefined,
    baseUrl: effectiveBaseUrl.value,
  }),
);

const altText = computed(() => props.alt ?? `${props.domain} logo`);

onMounted(() => {
  if (effectiveToken.value) fireBeacon(effectiveToken.value);
});
</script>

<template>
  <a
    v-if="href && isValidHref(href)"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :class="props.class"
    :style="props.style"
  >
    <img :src="src" :alt="altText" :loading="loading" @error="emit('error', $event)" @load="emit('load', $event)" />
  </a>
  <span v-else-if="props.class || props.style" :class="props.class" :style="props.style">
    <img :src="src" :alt="altText" :loading="loading" @error="emit('error', $event)" @load="emit('load', $event)" />
  </span>
  <img v-else :src="src" :alt="altText" :loading="loading" @error="emit('error', $event)" @load="emit('load', $event)" />
</template>
