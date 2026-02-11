<script setup lang="ts">
import { ref, h } from "vue";
import {
  QuikturnLogo,
  QuikturnLogoCarousel,
  QuikturnLogoGrid,
  useLogoUrl,
} from "@quikturn/logos-vue";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const partners = [
  "github.com",
  "stripe.com",
  "vercel.com",
  "figma.com",
  "linear.app",
  "notion.so",
  "slack.com",
  "discord.com",
];

const partnerLogos = [
  { domain: "github.com", href: "https://github.com", alt: "GitHub" },
  { domain: "stripe.com", href: "https://stripe.com", alt: "Stripe" },
  { domain: "vercel.com", href: "https://vercel.com", alt: "Vercel" },
  { domain: "figma.com", href: "https://figma.com", alt: "Figma" },
];

// ---------------------------------------------------------------------------
// Composable demo
// ---------------------------------------------------------------------------

const composableDomain = ref("github.com");
const composableUrl = useLogoUrl(composableDomain, { size: 256, format: "webp" });
</script>

<template>
  <div :style="appStyle">
    <header :style="headerStyle">
      <h1 :style="{ margin: 0, fontSize: '24px' }">
        Quikturn Logos Vue Demo
      </h1>
      <p :style="{ margin: '8px 0 0', color: '#666', fontSize: '14px' }">
        All examples from the
        <a href="https://www.npmjs.com/package/@quikturn/logos-vue">
          @quikturn/logos-vue
        </a>
        README, running live.
      </p>
    </header>

    <!-- ----------------------------------------------------------------- -->
    <!-- 1. Single Logo                                                     -->
    <!-- ----------------------------------------------------------------- -->
    <section :style="sectionStyle">
      <h2 :style="headingStyle">1. Single Logo</h2>
      <p :style="descStyle">
        Standalone <code>&lt;QuikturnLogo&gt;</code> with custom size and format.
      </p>
      <div :style="{ display: 'flex', gap: '24px', alignItems: 'center' }">
        <QuikturnLogo domain="github.com" :size="64" />
        <QuikturnLogo domain="stripe.com" :size="64" format="webp" />
        <QuikturnLogo domain="vercel.com" :size="64" greyscale />
        <QuikturnLogo domain="figma.com" :size="64" href="https://figma.com" />
      </div>
    </section>

    <!-- ----------------------------------------------------------------- -->
    <!-- 2. Logo Wall (Carousel)                                           -->
    <!-- ----------------------------------------------------------------- -->
    <section :style="sectionStyle">
      <h2 :style="headingStyle">2. Logo Wall (Carousel)</h2>
      <p :style="descStyle">
        Infinite scrolling carousel -- pauses on hover, fades at edges.
      </p>
      <QuikturnLogoCarousel
        :domains="partners"
        :speed="80"
        :logo-height="32"
        :gap="64"
        fade-out
        pause-on-hover
      />
    </section>

    <!-- ----------------------------------------------------------------- -->
    <!-- 3. Partner Grid with Links                                        -->
    <!-- ----------------------------------------------------------------- -->
    <section :style="sectionStyle">
      <h2 :style="headingStyle">3. Partner Grid with Links</h2>
      <p :style="descStyle">
        Responsive CSS grid -- each logo links to the company site.
      </p>
      <QuikturnLogoGrid :logos="partnerLogos" :columns="2" :gap="32" />
    </section>

    <!-- ----------------------------------------------------------------- -->
    <!-- 4. Vertical Carousel                                              -->
    <!-- ----------------------------------------------------------------- -->
    <section :style="sectionStyle">
      <h2 :style="headingStyle">4. Vertical Carousel</h2>
      <p :style="descStyle">Scrolls upward inside a fixed-height container.</p>
      <div :style="{ height: '240px', border: '1px solid #e0e0e0', borderRadius: '8px' }">
        <QuikturnLogoCarousel
          :domains="['github.com', 'stripe.com', 'vercel.com', 'figma.com', 'linear.app', 'notion.so']"
          direction="up"
          :speed="60"
          :logo-height="24"
          :gap="24"
        />
      </div>
    </section>

    <!-- ----------------------------------------------------------------- -->
    <!-- 5. useLogoUrl Composable                                          -->
    <!-- ----------------------------------------------------------------- -->
    <section :style="sectionStyle">
      <h2 :style="headingStyle">5. useLogoUrl Composable</h2>
      <p :style="descStyle">
        Type a domain and see the logo update reactively via <code>useLogoUrl</code>.
      </p>
      <div :style="{ display: 'flex', gap: '16px', alignItems: 'center' }">
        <input
          v-model="composableDomain"
          placeholder="Enter a domain"
          :style="inputStyle"
        />
        <img :src="composableUrl" :alt="`${composableDomain} logo`" :style="{ height: '48px', width: 'auto' }" />
      </div>
    </section>

    <footer :style="footerStyle">
      Powered by
      <a href="https://getquikturn.io">Quikturn</a>
    </footer>
  </div>
</template>

<script lang="ts">
// ---------------------------------------------------------------------------
// Styles (declared as module-level constants for template binding)
// ---------------------------------------------------------------------------

const appStyle = {
  maxWidth: "800px",
  margin: "0 auto",
  padding: "32px 24px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const headerStyle = {
  marginBottom: "40px",
  paddingBottom: "24px",
  borderBottom: "1px solid #e0e0e0",
};

const sectionStyle = {
  marginBottom: "48px",
};

const headingStyle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "4px",
};

const descStyle = {
  fontSize: "14px",
  color: "#666",
  marginBottom: "16px",
};

const footerStyle = {
  marginTop: "64px",
  paddingTop: "24px",
  borderTop: "1px solid #e0e0e0",
  fontSize: "13px",
  color: "#999",
  textAlign: "center" as const,
};

const inputStyle = {
  padding: "8px 12px",
  fontSize: "14px",
  border: "1px solid #d0d0d0",
  borderRadius: "6px",
  outline: "none",
  width: "220px",
};
</script>
