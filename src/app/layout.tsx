import type { Metadata } from "next";
import { preload } from "react-dom";
import { site } from "@/data/site";
import { HERO_POSTER } from "@/lib/hero-assets";
import { getSiteUrl } from "@/lib/site-url";
import { manrope, robotoCondensed } from "./fonts";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.seoTitle,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    "барбершоп у Львові",
    "барбершоп Львів",
    "Lev Barber",
    "барбершоп Lev Barber",
    "чоловіча стрижка Львів",
    "барбер Івана Франка",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: site.seoTitle,
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
        alt: site.seoTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seoTitle,
    description: site.description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
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
      className={`${manrope.variable} ${robotoCondensed.variable} h-full antialiased`}
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
