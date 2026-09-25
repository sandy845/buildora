import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Buildora | Construction & Interior Design",
    template: "%s | Buildora",
  },
  description:
    "Professional construction, RCC, interior design, and renovation services by Buildora.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable} data-scroll-behavior="smooth">
      <body className="bg-background text-foreground antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}