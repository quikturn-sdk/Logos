<script lang="ts">
  import { QuikturnProvider, QuikturnLogo, QuikturnLogoGrid, QuikturnLogoCarousel } from "@quikturn/logos-svelte";
</script>

<main style="max-width: 960px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif;">
  <h1>Quikturn Logos — Svelte Demo</h1>

  <QuikturnProvider token="qt_demo">
    <section>
      <h2>Single Logo</h2>
      <QuikturnLogo domain="github.com" />
    </section>

    <section>
      <h2>Logo Grid</h2>
      <QuikturnLogoGrid
        domains={["github.com", "stripe.com", "vercel.com", "figma.com"]}
        columns={4}
        gap={24}
      />
    </section>

    <section>
      <h2>Logo Carousel</h2>
      <QuikturnLogoCarousel
        domains={["github.com", "stripe.com", "vercel.com", "figma.com", "slack.com", "discord.com"]}
        speed={80}
        logoHeight={32}
        gap={48}
        fadeOut
      />
    </section>
  </QuikturnProvider>
</main>
