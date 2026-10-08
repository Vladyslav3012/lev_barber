/**
 * Canonical site origin for metadata, JSON-LD, and Origin checks.
 * Required in production — set NEXT_PUBLIC_SITE_URL (no trailing slash).
 * Local prod smoke tests may use http://localhost:3000; real deploy should use https://…
 */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    if (!raw) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL is required in production (e.g. https://example.com or http://localhost:3000).",
      );
    }
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error(
        `NEXT_PUBLIC_SITE_URL must be a valid absolute URL (got "${raw}").`,
      );
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must use http:// or https://.",
      );
    }
    const isLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!isLocal && parsed.protocol !== "https:") {
      console.warn(
        `[site-url] NEXT_PUBLIC_SITE_URL is "${raw}" — use https:// for a public deploy.`,
      );
    }
    return raw;
  }

  if (raw) return raw;
  return "http://localhost:3000";
}
