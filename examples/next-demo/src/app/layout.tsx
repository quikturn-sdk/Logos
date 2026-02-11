import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quikturn Logos — Next.js Demo",
  description: "Demo app showcasing @quikturn/logos-next",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {children}
      </body>
    </html>
  );
}
