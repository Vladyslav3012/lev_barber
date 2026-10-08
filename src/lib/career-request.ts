import { getSiteUrl } from "@/lib/site-url";

/** Career JSON is tiny (name/contact/message); reject anything larger early. */
export const CAREER_MAX_BODY_BYTES = 16 * 1024;

export class BodyTooLargeError extends Error {
  constructor() {
    super("body too large");
    this.name = "BodyTooLargeError";
  }
}

/**
 * Client IP for the in-app limiter.
 * - Vercel: trust x-vercel-forwarded-for only when VERCEL=1.
 * - Our Docker/nginx: trust X-Real-IP / single-hop X-Forwarded-For only when
 *   TRUST_PROXY=1 (compose sets this). Bare `next start` ignores those headers
 *   so a client cannot spoof the limiter by sending them directly to Node.
 */
export function clientIp(
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
) {
  if (env.VERCEL === "1") {
    const vercel = headers.get("x-vercel-forwarded-for");
    if (vercel) return vercel.split(",")[0]?.trim() || "unknown";
  }

  if (env.TRUST_PROXY === "1") {
    const realIp = headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;

    // Single hop set by our nginx (`proxy_set_header X-Forwarded-For $remote_addr`).
    const forwarded = headers.get("x-forwarded-for")?.trim();
    if (forwarded && !forwarded.includes(",")) return forwarded;
  }

  return "unknown";
}

export function parseExtraOrigins(raw: string | undefined) {
  if (!raw?.trim()) return [] as string[];

  const origins: string[] = [];
  for (const part of raw.split(",")) {
    const candidate = part.trim();
    if (!candidate) continue;
    try {
      origins.push(new URL(candidate).origin);
    } catch {
      console.error("CAREER_ALLOWED_ORIGINS entry is not a valid URL", candidate);
    }
  }
  return origins;
}

function configuredSiteOrigin() {
  try {
    return new URL(getSiteUrl()).origin;
  } catch {
    return null;
  }
}

/** Dev-only: origin derived from this request (ngrok / local Host). Never used in production. */
export function requestPublicOrigin(headers: Headers) {
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host")?.trim();
  if (!host) return null;

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return null;
  }
}

export type CareerOriginContext = {
  isProd: boolean;
  siteOrigin: string | null;
  extraOrigins: string[];
  /** Dev-only Host-derived origin; ignored when isProd. */
  publicOrigin: string | null;
};

export function careerOriginContext(
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
): CareerOriginContext {
  const isProd = env.NODE_ENV === "production";
  return {
    isProd,
    siteOrigin: configuredSiteOrigin(),
    extraOrigins: parseExtraOrigins(env.CAREER_ALLOWED_ORIGINS),
    publicOrigin: isProd ? null : requestPublicOrigin(headers),
  };
}

export function allowedOriginsFromContext(ctx: CareerOriginContext) {
  const allowed = new Set<string>();
  if (ctx.siteOrigin) allowed.add(ctx.siteOrigin);
  for (const origin of ctx.extraOrigins) allowed.add(origin);
  if (!ctx.isProd && ctx.publicOrigin) allowed.add(ctx.publicOrigin);
  return allowed;
}

/**
 * Browser CSRF guard for POST /api/career.
 * Production: only NEXT_PUBLIC_SITE_URL + CAREER_ALLOWED_ORIGINS; missing Origin/Referer → deny.
 */
export function isAllowedOrigin(
  headers: Headers,
  ctx: CareerOriginContext,
) {
  const allowed = allowedOriginsFromContext(ctx);

  if (allowed.size === 0) {
    return !ctx.isProd;
  }

  const origin = headers.get("origin");
  if (origin) {
    try {
      return allowed.has(new URL(origin).origin);
    } catch {
      return false;
    }
  }

  const referer = headers.get("referer");
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return !ctx.isProd;
}

export async function readCareerJsonBody(
  request: Request,
  maxBytes = CAREER_MAX_BODY_BYTES,
): Promise<Record<string, unknown>> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const len = Number(contentLength);
    if (!Number.isFinite(len) || len < 0 || len > maxBytes) {
      throw new BodyTooLargeError();
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new SyntaxError("empty body");
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(merged);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SyntaxError("invalid json");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new SyntaxError("json must be an object");
  }
  return parsed as Record<string, unknown>;
}
