import {
  QuikturnProvider,
  QuikturnLogo,
  QuikturnLogoCarousel,
  QuikturnLogoGrid,
} from "@quikturn/logos-react";

// ---------------------------------------------------------------------------
// 1. Logo Wall (Marketing Page)
// ---------------------------------------------------------------------------

const PARTNERS = [
  "github.com",
  "stripe.com",
  "vercel.com",
  "figma.com",
  "linear.app",
  "notion.so",
  "slack.com",
  "discord.com",
];

function LogoWall() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>1. Logo Wall (Carousel)</h2>
      <p style={descStyle}>
        Infinite scrolling carousel -- pauses on hover, fades at edges.
      </p>
      <QuikturnLogoCarousel
        domains={PARTNERS}
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
        Responsive CSS grid -- each logo links to the company site.
      </p>
      <QuikturnLogoGrid
        logos={[
          { domain: "github.com", href: "https://github.com", alt: "GitHub" },
          { domain: "stripe.com", href: "https://stripe.com", alt: "Stripe" },
          { domain: "vercel.com", href: "https://vercel.com", alt: "Vercel" },
          { domain: "figma.com", href: "https://figma.com", alt: "Figma" },
        ]}
        columns={2}
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
        Uses <code>renderItem</code> to wrap each logo in a custom card.
      </p>
      <QuikturnLogoCarousel
        domains={[
          "github.com",
          "stripe.com",
          "vercel.com",
          "figma.com",
          "linear.app",
        ]}
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
      <p style={descStyle}>Scrolls upward inside a fixed-height container.</p>
      <div style={{ height: 240, border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <QuikturnLogoCarousel
          domains={[
            "github.com",
            "stripe.com",
            "vercel.com",
            "figma.com",
            "linear.app",
            "notion.so",
          ]}
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
// 5. Single Logo
// ---------------------------------------------------------------------------

function SingleLogo() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>5. Single Logo</h2>
      <p style={descStyle}>
        Standalone <code>&lt;QuikturnLogo&gt;</code> with custom size and
        format.
      </p>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <QuikturnLogo domain="github.com" size={64} />
        <QuikturnLogo domain="stripe.com" size={64} format="webp" />
        <QuikturnLogo
          domain="vercel.com"
          size={64}
          greyscale
        />
        <QuikturnLogo
          domain="figma.com"
          size={64}
          href="https://figma.com"
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  return (
    <QuikturnProvider token="">
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

        <SingleLogo />
        <LogoWall />
        <PartnerGrid />
        <CustomCarousel />
        <VerticalCarousel />

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
  maxWidth: 800,
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

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#666",
  marginBottom: 16,
};

const footerStyle: React.CSSProperties = {
  marginTop: 64,
  paddingTop: 24,
  borderTop: "1px solid #e0e0e0",
  fontSize: 13,
  color: "#999",
  textAlign: "center",
};
