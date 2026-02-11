"use client";

import {
  QuikturnImage,
  QuikturnLogo,
  QuikturnLogoGrid,
  QuikturnProvider,
  createQuikturnImageLoader,
} from "@quikturn/logos-next";

const DEMO_TOKEN = process.env.NEXT_PUBLIC_QUIKTURN_TOKEN ?? "qt_demo";

const DEMO_DOMAINS = [
  "github.com",
  "vercel.com",
  "stripe.com",
  "linear.app",
  "figma.com",
  "notion.so",
];

const customLoader = createQuikturnImageLoader({
  token: DEMO_TOKEN,
  format: "webp",
});

export default function Home() {
  return (
    <QuikturnProvider token={DEMO_TOKEN}>
      <h1>Quikturn Logos — Next.js Demo</h1>
      <p>
        This demo showcases <code>@quikturn/logos-next</code> — Next.js
        components for the{" "}
        <a href="https://getquikturn.io">Quikturn Logos API</a>.
      </p>

      <hr style={{ margin: "2rem 0" }} />

      {/* Example 1: QuikturnImage (wraps next/image) */}
      <section>
        <h2>1. QuikturnImage</h2>
        <p>
          Wraps <code>next/image</code> with automatic Quikturn URL generation.
          Gets srcset, lazy loading, priority, and format optimization for free.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <QuikturnImage
            domain="github.com"
            token={DEMO_TOKEN}
            width={128}
            height={128}
            alt="GitHub"
            priority
          />
          <QuikturnImage
            domain="vercel.com"
            token={DEMO_TOKEN}
            width={128}
            height={128}
            alt="Vercel"
            format="webp"
          />
          <QuikturnImage
            domain="stripe.com"
            token={DEMO_TOKEN}
            width={128}
            height={128}
            alt="Stripe"
            greyscale
          />
          <QuikturnImage
            domain="linear.app"
            token={DEMO_TOKEN}
            width={128}
            height={128}
            alt="Linear"
            theme="dark"
          />
        </div>
      </section>

      <hr style={{ margin: "2rem 0" }} />

      {/* Example 2: QuikturnLogo (re-exported from React package) */}
      <section>
        <h2>2. QuikturnLogo (from React package)</h2>
        <p>
          Re-exported from <code>@quikturn/logos-react</code> — renders a plain{" "}
          <code>&lt;img&gt;</code> with optional link.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <QuikturnLogo domain="figma.com" token={DEMO_TOKEN} size={64} />
          <QuikturnLogo
            domain="notion.so"
            token={DEMO_TOKEN}
            size={64}
            href="https://notion.so"
          />
        </div>
      </section>

      <hr style={{ margin: "2rem 0" }} />

      {/* Example 3: QuikturnLogoGrid */}
      <section>
        <h2>3. Logo Grid</h2>
        <p>Responsive grid layout with 3 columns.</p>
        <QuikturnLogoGrid
          token={DEMO_TOKEN}
          logos={DEMO_DOMAINS.map((d) => ({ domain: d }))}
          columns={3}
          gap={16}
        />
      </section>

      <hr style={{ margin: "2rem 0" }} />

      {/* Example 4: Custom Image Loader */}
      <section>
        <h2>4. Custom Image Loader</h2>
        <p>
          Use <code>createQuikturnImageLoader()</code> for full control over the
          loader configuration.
        </p>
        <QuikturnImage
          domain="stripe.com"
          token={DEMO_TOKEN}
          width={256}
          height={256}
          alt="Stripe (custom loader)"
        />
      </section>
    </QuikturnProvider>
  );
}
