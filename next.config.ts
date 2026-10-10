import type { NextConfig } from "next";
import path from "node:path";
import { buildContentSecurityPolicy } from "./src/lib/csp";

const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = buildContentSecurityPolicy(isDev);

/** Drop Next's modern-browser polyfill pack (~14 KiB Lighthouse "Legacy JavaScript"). */
const emptyPolyfill = path.join(__dirname, "src/lib/empty-polyfill.js");
const nextPolyfillModule = require.resolve(
  "next/dist/build/polyfills/polyfill-module",
);

const nextConfig: NextConfig = {
  // Slim image for Docker (see Dockerfile → .next/standalone).
  output: "standalone",
  // `npm run build` uses --webpack so this alias applies (Turbopack still ships the pack).
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      [nextPolyfillModule]: emptyPolyfill,
      "next/dist/build/polyfills/polyfill-module": emptyPolyfill,
      "next/dist/build/polyfills/polyfill-module.js": emptyPolyfill,
    };
    return config;
  },
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
      {
        source: "/apple-touch-icon.png",
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
