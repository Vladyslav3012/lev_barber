/**
 * CSP for the marketing site: Next.js self-hosted fonts/scripts, local media,
 * Google tag/Analytics, and Google Maps embed. Uses 'unsafe-inline' for
 * styles/scripts so the homepage can stay statically optimized (nonce CSP would force dynamic
 * rendering). Booking is an external Altegio link (no widget script); Altegio
 * remains in frame-src if a widget is embedded later.
 *
 * HSTS is set by nginx (snippets/hsts-headers.conf), not Next.js.
 */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const altegio = "https://*.alteg.io https://alteg.io";
  // Google tag + Analytics endpoints without Google Ads features.
  // https://developers.google.com/tag-platform/security/guides/csp
  const googleTag = "https://www.googletagmanager.com";
  const googleAnalytics = "https://*.google-analytics.com";

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    googleTag,
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${googleTag} ${googleAnalytics}`,
    "font-src 'self'",
    "media-src 'self'",
    `connect-src 'self' ${googleTag} ${googleAnalytics} https://*.google.com`,
    `frame-src https://maps.google.com https://www.google.com https://maps.googleapis.com ${altegio}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
