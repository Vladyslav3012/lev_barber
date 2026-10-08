/**
 * CSP for the marketing site: Next.js self-hosted fonts/scripts, local media,
 * Google Maps embed, and Altegio widget hosts (script/frame) for when booking
 * is embedded. Uses 'unsafe-inline' for styles/scripts so the homepage can stay
 * statically optimized (nonce CSP would force dynamic rendering).
 *
 * Served as Content-Security-Policy-Report-Only until violations are clean in test.
 * HSTS is set by nginx (snippets/hsts-headers.conf), not Next.js.
 */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const altegio = "https://*.alteg.io https://alteg.io";

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    altegio,
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'",
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
