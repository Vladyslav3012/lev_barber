import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/csp";

const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = buildContentSecurityPolicy(isDev);

const nextConfig: NextConfig = {
  // Slim image for Docker (see Dockerfile → .next/standalone).
  output: "standalone",
  // ngrok / phone testing: without this, Next blocks /_next/* from the tunnel
  // origin and client components never hydrate (links work, buttons don't).
  ...(isDev
    ? {
        allowedDevOrigins: [
          "*.ngrok-free.dev",
          "*.ngrok-free.app",
          "*.ngrok.io",
          "*.ngrok.app",
        ],
      }
    : {}),
  poweredByHeader: false,
  images: {
    // Pre-sized files in /public — no Sharp in the image. next/image still
    // handles layout + lazy loading.
    unoptimized: true,
    // Cache-bust via ?v=<mtime> (see versionedPublicSrc); long TTL is safe.
    minimumCacheTTL: 86400, // 1 day
    localPatterns: [
      // Omit search → any ?v=<mtime>; only these public folders use next/image.
      { pathname: "/atmosphere/**" },
      { pathname: "/barbers/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
      {
        // Bump filename (hero.v2.mp4) when replacing; immutable cache is safe with a new URL.
        source: "/hero.v1.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/hero-poster.v2.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Paths are cache-busted via ?v=<mtime> (versionedPublicSrc).
        source: "/atmosphere/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/barbers/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/og.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
