/**
 * Canonical site origin for metadata, JSON-LD, and Origin checks.
 * Required in production — set NEXT_PUBLIC_SITE_URL (no trailing slash).
 */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (raw) return raw;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required in production (e.g. https://example.com).",
  );
}
