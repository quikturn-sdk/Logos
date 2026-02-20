import {
  QuikturnProvider,
  QuikturnLogo,
  QuikturnLogoCarousel,
  QuikturnLogoGrid,
} from "@quikturn/logos-react";

// Import the web component — auto-registers <quikturn-logo>
import "@quikturn/logos/element";

// Set your publishable key via VITE_QUIKTURN_TOKEN env var or paste it here
const TOKEN = import.meta.env.VITE_QUIKTURN_TOKEN ?? "";

// ---------------------------------------------------------------------------
// Domain lists
// ---------------------------------------------------------------------------

const TECH_COMPANIES = [
  "github.com",
  "stripe.com",
  "vercel.com",
  "figma.com",
  "linear.app",
  "notion.so",
  "slack.com",
  "discord.com",
  "gitlab.com",
  "shopify.com",
  "atlassian.com",
  "datadog.com",
  "cloudflare.com",
  "twilio.com",
  "hashicorp.com",
  "mongodb.com",
];

const DESIGN_TOOLS = [
  "figma.com",
  "canva.com",
  "sketch.com",
  "framer.com",
  "webflow.com",
  "miro.com",
];

const DEVTOOLS = [
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "linear.app",
  "sentry.io",
  "postman.com",
  "docker.com",
  "terraform.io",
];

// ---------------------------------------------------------------------------
// 1. Logo Wall (Marketing Page)
// ---------------------------------------------------------------------------

function LogoWall() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>1. Logo Wall (Carousel)</h2>
      <p style={descStyle}>
        Infinite scrolling carousel -- pauses on hover, fades at edges. 16
        companies.
      </p>
      <QuikturnLogoCarousel
        domains={TECH_COMPANIES}
        speed={80}
        logoHeight={32}
        gap={64}
        fadeOut
        pauseOnHover
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Partner Grid with Links
// ---------------------------------------------------------------------------

function PartnerGrid() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>2. Partner Grid with Links</h2>
      <p style={descStyle}>
        Responsive CSS grid -- each logo links to the company site. Mix of
        sizes and formats.
      </p>
      <QuikturnLogoGrid
        logos={[
          { domain: "github.com", href: "https://github.com", alt: "GitHub" },
          { domain: "stripe.com", href: "https://stripe.com", alt: "Stripe" },
          { domain: "vercel.com", href: "https://vercel.com", alt: "Vercel" },
          { domain: "figma.com", href: "https://figma.com", alt: "Figma" },
          { domain: "shopify.com", href: "https://shopify.com", alt: "Shopify" },
          { domain: "cloudflare.com", href: "https://cloudflare.com", alt: "Cloudflare" },
          { domain: "twilio.com", href: "https://twilio.com", alt: "Twilio" },
          { domain: "datadog.com", href: "https://datadog.com", alt: "Datadog" },
        ]}
        columns={4}
        gap={32}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Custom Carousel Item
// ---------------------------------------------------------------------------

function CustomCarousel() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>3. Custom Carousel Item</h2>
      <p style={descStyle}>
        Uses <code>renderItem</code> to wrap each logo in a custom card with
        domain label. DevTools companies.
      </p>
      <QuikturnLogoCarousel
        domains={DEVTOOLS}
        speed={100}
        logoHeight={32}
        gap={24}
        renderItem={(logo) => (
          <div
            style={{
              padding: 16,
              background: "#f9f9f9",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <img
              src={logo.url}
              alt={logo.alt}
              style={{ height: 32, width: "auto" }}
            />
            <span style={{ fontSize: 11, color: "#666" }}>{logo.domain}</span>
          </div>
        )}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Vertical Carousel
// ---------------------------------------------------------------------------

function VerticalCarousel() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>4. Vertical Carousel</h2>
      <p style={descStyle}>
        Scrolls upward inside a fixed-height container. Design tools.
      </p>
      <div style={{ height: 240, border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <QuikturnLogoCarousel
          domains={DESIGN_TOOLS}
          direction="up"
          speed={60}
          logoHeight={24}
          gap={24}
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Single Logos — Sizes & Formats
// ---------------------------------------------------------------------------

function SingleLogos() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>5. Single Logos</h2>
      <p style={descStyle}>
        Standalone <code>&lt;QuikturnLogo&gt;</code> showcasing size, format,
        greyscale, theme, and variant options.
      </p>

      <h3 style={subheadingStyle}>Sizes</h3>
      <div style={rowStyle}>
        <LabeledLogo domain="github.com" size={32} label="32px" />
        <LabeledLogo domain="github.com" size={64} label="64px" />
        <LabeledLogo domain="github.com" size={128} label="128px" />
        <LabeledLogo domain="github.com" size={256} label="256px" />
      </div>

      <h3 style={subheadingStyle}>Formats</h3>
      <div style={rowStyle}>
        <LabeledLogo domain="stripe.com" size={128} label="png (default)" />
        <LabeledLogo domain="stripe.com" size={128} format="webp" label="webp" />
        <LabeledLogo domain="stripe.com" size={128} format="avif" label="avif" />
        <LabeledLogo domain="stripe.com" size={128} format="jpeg" label="jpeg" />
      </div>

      <h3 style={subheadingStyle}>Greyscale</h3>
      <div style={rowStyle}>
        <LabeledLogo domain="vercel.com" size={128} label="color" />
        <LabeledLogo domain="vercel.com" size={128} greyscale label="greyscale" />
        <LabeledLogo domain="figma.com" size={128} label="color" />
        <LabeledLogo domain="figma.com" size={128} greyscale label="greyscale" />
      </div>

      <h3 style={subheadingStyle}>Themes</h3>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ ...themeBoxStyle, background: "#fff" }}>
          <LabeledLogo domain="slack.com" size={128} theme="light" label="light theme" />
        </div>
        <div style={{ ...themeBoxStyle, background: "#1a1a1a" }}>
          <LabeledLogo domain="slack.com" size={128} theme="dark" label="dark theme" labelColor="#999" />
        </div>
        <div style={{ ...themeBoxStyle, background: "#fff" }}>
          <LabeledLogo domain="notion.so" size={128} theme="light" label="light theme" />
        </div>
        <div style={{ ...themeBoxStyle, background: "#1a1a1a" }}>
          <LabeledLogo domain="notion.so" size={128} theme="dark" label="dark theme" labelColor="#999" />
        </div>
      </div>

      <h3 style={subheadingStyle}>Variant (full vs icon)</h3>
      <div style={rowStyle}>
        <LabeledLogo domain="github.com" size={128} label="full" />
        <LabeledLogo domain="github.com" size={128} variant="icon" label="icon" />
        <LabeledLogo domain="stripe.com" size={128} label="full" />
        <LabeledLogo domain="stripe.com" size={128} variant="icon" label="icon" />
        <LabeledLogo domain="figma.com" size={128} label="full" />
        <LabeledLogo domain="figma.com" size={128} variant="icon" label="icon" />
      </div>

      <h3 style={subheadingStyle}>With links</h3>
      <div style={rowStyle}>
        <QuikturnLogo domain="github.com" size={128} href="https://github.com" />
        <QuikturnLogo domain="shopify.com" size={128} href="https://shopify.com" />
        <QuikturnLogo domain="cloudflare.com" size={128} href="https://cloudflare.com" />
        <QuikturnLogo domain="atlassian.com" size={128} href="https://atlassian.com" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Greyscale Grid
// ---------------------------------------------------------------------------

function GreyscaleGrid() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>6. Greyscale Grid</h2>
      <p style={descStyle}>
        All logos rendered in greyscale using the <code>logoGreyscale</code> prop.
      </p>
      <QuikturnLogoGrid
        logos={[
          { domain: "github.com", alt: "GitHub" },
          { domain: "stripe.com", alt: "Stripe" },
          { domain: "vercel.com", alt: "Vercel" },
          { domain: "figma.com", alt: "Figma" },
          { domain: "shopify.com", alt: "Shopify" },
          { domain: "cloudflare.com", alt: "Cloudflare" },
          { domain: "notion.so", alt: "Notion" },
          { domain: "linear.app", alt: "Linear" },
        ]}
        columns={4}
        gap={32}
        logoGreyscale
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. Right-to-Left Carousel
// ---------------------------------------------------------------------------

function ReverseCarousel() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>7. Right-to-Left Carousel</h2>
      <p style={descStyle}>
        Scrolls right with scale-on-hover. WebP format, larger logos.
      </p>
      <QuikturnLogoCarousel
        domains={TECH_COMPANIES.slice(0, 10)}
        direction="right"
        speed={60}
        logoHeight={48}
        gap={48}
        fadeOut
        scaleOnHover
        logoFormat="webp"
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8. Web Component (<quikturn-logo> custom element)
// ---------------------------------------------------------------------------

function WebComponentDemo() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>8. Web Component (No Framework)</h2>
      <p style={descStyle}>
        Native <code>&lt;quikturn-logo&gt;</code> custom element with shadow DOM
        attribution badge. Shows size, greyscale, theme, and variant attributes.
      </p>
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        {/* @ts-expect-error -- custom element attributes not in JSX.IntrinsicElements */}
        <quikturn-logo domain="github.com" token={TOKEN} size="128"></quikturn-logo>
        {/* @ts-expect-error -- custom element */}
        <quikturn-logo domain="stripe.com" token={TOKEN} size="128"></quikturn-logo>
        {/* @ts-expect-error -- custom element */}
        <quikturn-logo domain="vercel.com" token={TOKEN} size="128" greyscale></quikturn-logo>
        {/* @ts-expect-error -- custom element */}
        <quikturn-logo domain="figma.com" token={TOKEN} size="128" theme="dark"></quikturn-logo>
        {/* @ts-expect-error -- custom element */}
        <quikturn-logo domain="shopify.com" token={TOKEN} size="128" variant="icon"></quikturn-logo>
        {/* @ts-expect-error -- custom element */}
        <quikturn-logo domain="cloudflare.com" token={TOKEN} size="128"></quikturn-logo>
      </div>
      <p style={{ ...descStyle, marginTop: 16 }}>
        Each element above includes a "Powered by Quikturn" attribution badge
        protected by shadow DOM with <code>!important</code> CSS rules.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function LabeledLogo({
  domain,
  size,
  format,
  greyscale,
  theme,
  variant,
  label,
  labelColor = "#666",
}: {
  domain: string;
  size: number;
  format?: "png" | "jpeg" | "webp" | "avif";
  greyscale?: boolean;
  theme?: "light" | "dark";
  variant?: "full" | "icon";
  label: string;
  labelColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <QuikturnLogo
        domain={domain}
        size={size}
        format={format}
        greyscale={greyscale}
        theme={theme}
        variant={variant}
      />
      <span style={{ fontSize: 11, color: labelColor }}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  return (
    <QuikturnProvider token={TOKEN}>
      <div style={appStyle}>
        <header style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            Quikturn Logos React Demo
          </h1>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
            All examples from the{" "}
            <a href="https://www.npmjs.com/package/@quikturn/logos-react">
              @quikturn/logos-react
            </a>{" "}
            README, running live.
          </p>
        </header>

        <LogoWall />
        <PartnerGrid />
        <CustomCarousel />
        <VerticalCarousel />
        <SingleLogos />
        <GreyscaleGrid />
        <ReverseCarousel />
        <WebComponentDemo />

        <footer style={footerStyle}>
          Powered by{" "}
          <a href="https://getquikturn.io">Quikturn</a>
        </footer>
      </div>
    </QuikturnProvider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const appStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "32px 24px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const headerStyle: React.CSSProperties = {
  marginBottom: 40,
  paddingBottom: 24,
  borderBottom: "1px solid #e0e0e0",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 48,
};

const headingStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 4,
};

const subheadingStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#444",
  margin: "20px 0 8px",
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#666",
  marginBottom: 16,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 24,
  alignItems: "center",
  flexWrap: "wrap",
};

const themeBoxStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  border: "1px solid #e0e0e0",
  flex: 1,
  display: "flex",
  justifyContent: "center",
};

const footerStyle: React.CSSProperties = {
  marginTop: 64,
  paddingTop: 24,
  borderTop: "1px solid #e0e0e0",
  fontSize: 13,
  color: "#999",
  textAlign: "center",
};
