import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ngrok / phone testing: without this, Next blocks /_next/* from the tunnel
  // origin and client components never hydrate (links work, buttons don't).
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
  ],
  poweredByHeader: false,
  images: {
    // Next 16 defaults to 4h; replaced public/ files kept serving old optimized images.
    minimumCacheTTL: 60,
    localPatterns: [
      // Allow ?v=<mtime> when public photos are replaced under the same filename.
      { pathname: "/atmosphere/**" },
      { pathname: "/barbers/**" },
      { pathname: "/**", search: "" },
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
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/hero.mp4",
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
