import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { preload } from "react-dom";
import { site } from "@/data/site";
import { HERO_POSTER } from "@/lib/hero-assets";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.city}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    "барбершоп Львів",
    "Lev Barber",
    "барбершоп Lev Barber",
    "стрижка Львів",
    "барбер Франка",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${site.name} — ${site.city}`,
    description: site.description,
    url: siteUrl,
    siteName: site.name,
    locale: "uk_UA",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${site.name} — барбершоп у Львові`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.city}`,
    description: site.description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preload(HERO_POSTER, { as: "image", fetchPriority: "high" });

  return (
    <html
      lang="uk"
      className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-charcoal font-sans text-mist"
        suppressHydrationWarning
      >
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
