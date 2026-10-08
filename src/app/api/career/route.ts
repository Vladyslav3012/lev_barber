import { NextRequest, NextResponse } from "next/server";
import {
  careerFieldsSchema,
  formatCareerTelegramHtml,
} from "@/lib/career-validation";
import { getSiteUrl } from "@/lib/site-url";

const WINDOW_MS = 60 * 1000;
/** Successful Telegram sends per IP per window (validation failures do not count). */
const MAX_REQUESTS = 3;
/** Career JSON is tiny (name/contact/message); reject anything larger early. */
const MAX_BODY_BYTES = 16 * 1024;
const hits = new Map<string, number[]>();

function pruneHits(now: number) {
  for (const [ip, times] of hits) {
    const recent = times.filter((time) => now - time < WINDOW_MS);
    if (recent.length === 0) hits.delete(ip);
    else hits.set(ip, recent);
  }
}

/**
 * In-process cap on successful sends. Shared flood control lives in nginx
 * (`limit_req zone=career`); this layer still limits Telegram spam per replica.
 */
function rateLimited(ip: string) {
  const now = Date.now();
  if (hits.size > 500) pruneHits(now);

  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  hits.set(ip, recent);
  return recent.length >= MAX_REQUESTS;
}

function recordHit(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Client IP for the in-app limiter. Only headers that our reverse proxy
 * overwrites (see nginx templates: X-Real-IP / X-Forwarded-For ← $remote_addr).
 * Do not fall back to a client-supplied X-Forwarded-For chain.
 */
function clientIp(request: NextRequest) {
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]?.trim() || "unknown";

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // Single hop set by our nginx (`proxy_set_header X-Forwarded-For $remote_addr`).
  // Reject multi-value lists — those are not produced by our templates.
  const forwarded = request.headers.get("x-forwarded-for")?.trim();
  if (forwarded && !forwarded.includes(",")) return forwarded;

  return "unknown";
}

function configuredSiteOrigin() {
  try {
    return new URL(getSiteUrl()).origin;
  } catch {
    return null;
  }
}

/** Dev-only: origin derived from this request (ngrok / local Host). Never used in production. */
function requestPublicOrigin(request: NextRequest) {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  if (!host) return null;

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
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

function isAllowedOrigin(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const allowed = new Set<string>();
  const configured = configuredSiteOrigin();
  if (configured) allowed.add(configured);

  // Production: only NEXT_PUBLIC_SITE_URL. Host / X-Forwarded-Host must not expand the allowlist.
  if (!isProd) {
    const publicOrigin = requestPublicOrigin(request);
    if (publicOrigin) allowed.add(publicOrigin);
  }

  if (allowed.size === 0) {
    return !isProd;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return allowed.has(new URL(origin).origin);
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  // Browsers sending a cross-site or same-site POST normally include Origin.
  // Missing both Origin and Referer is not treated as safe in production.
  return !isProd;
}

class BodyTooLargeError extends Error {
  constructor() {
    super("body too large");
    this.name = "BodyTooLargeError";
  }
}

async function readJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const len = Number(contentLength);
    if (!Number.isFinite(len) || len < 0 || len > MAX_BODY_BYTES) {
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
    if (total > MAX_BODY_BYTES) {
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
  return JSON.parse(text) as Record<string, unknown>;
}

const TELEGRAM_TIMEOUT_MS = 8_000;

async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
) {
  try {
    const telegram = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      },
    );

    if (!telegram.ok) {
      // Log status only — never forward Telegram body (may echo bot token).
      console.error("Telegram send failed", telegram.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Telegram send failed",
      error instanceof Error ? error.name : "error",
    );
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "Некоректний запит." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return NextResponse.json(
        { ok: false, error: "Некоректний запит." },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Некоректний запит." },
      { status: 400 },
    );
  }

  // Honeypot — pretend success, skip Telegram.
  if (asText(body.website)) {
    return NextResponse.json({ ok: true });
  }

  const parsed = careerFieldsSchema.safeParse({
    name: body.name,
    contact: body.contact,
    message: body.message,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Заповни всі поля коректно." },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Забагато спроб. Спробуй пізніше." },
      { status: 429 },
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.error("Career form misconfigured: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing");
    return NextResponse.json(
      { ok: false, error: "Форма тимчасово недоступна. Напиши в Instagram." },
      { status: 503 },
    );
  }

  const text = formatCareerTelegramHtml(parsed.data);
  const sent = await sendTelegramMessage(token, chatId, text);
  if (!sent) {
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати. Спробуй ще раз." },
      { status: 502 },
    );
  }

  recordHit(ip);
  return NextResponse.json({ ok: true });
}
