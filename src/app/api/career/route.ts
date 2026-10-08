import { NextRequest, NextResponse } from "next/server";
import {
  contactError,
  messageError,
  nameError,
  normalizeContact,
  singleLine,
} from "@/lib/career-validation";
import { getSiteUrl } from "@/lib/site-url";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 1;
const hits = new Map<string, number[]>();

function pruneHits(now: number) {
  for (const [ip, times] of hits) {
    const recent = times.filter((time) => now - time < WINDOW_MS);
    if (recent.length === 0) hits.delete(ip);
    else hits.set(ip, recent);
  }
}

function rateLimited(ip: string) {
  const now = Date.now();
  if (hits.size > 500) pruneHits(now);

  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clientIp(request: NextRequest) {
  // Prefer platform-injected IP when present (e.g. Vercel).
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]?.trim() || "unknown";

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Rightmost is usually the trusted proxy hop when the edge appends.
    const parts = forwarded.split(",").map((part) => part.trim());
    return parts[parts.length - 1] || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function configuredSiteOrigin() {
  try {
    return new URL(getSiteUrl()).origin;
  } catch {
    return null;
  }
}

/** Origin of this request as seen by the client (supports proxies / ngrok). */
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
  const allowed = new Set<string>();
  const configured = configuredSiteOrigin();
  if (configured) allowed.add(configured);
  const publicOrigin = requestPublicOrigin(request);
  if (publicOrigin) allowed.add(publicOrigin);

  if (allowed.size === 0) {
    return process.env.NODE_ENV !== "production";
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

  // Same-origin POSTs from some clients omit both; allow only outside production.
  return process.env.NODE_ENV !== "production";
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
        }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      },
    );

    if (!telegram.ok) {
      const detail = await telegram.text().catch(() => "");
      console.error(
        "Telegram send failed",
        telegram.status,
        detail.slice(0, 200),
      );
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

  const ip = clientIp(request);

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Забагато спроб. Спробуй пізніше." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некоректний запит." },
      { status: 400 },
    );
  }

  // Honeypot — pretend success, skip Telegram.
  if (asText(body.website)) {
    return NextResponse.json({ ok: true });
  }

  const name = asText(body.name);
  const contact = normalizeContact(asText(body.contact));
  const message = asText(body.message);

  if (nameError(name) || contactError(contact) || messageError(message)) {
    return NextResponse.json(
      { ok: false, error: "Заповни всі поля коректно." },
      { status: 400 },
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: "Форма ще не підключена. Напиши в Instagram." },
      { status: 503 },
    );
  }

  const text = [
    "Нова заявка — стати барбером",
    `Ім’я: ${singleLine(name)}`,
    `Контакт: ${singleLine(contact)}`,
    "",
    message,
  ].join("\n");

  const sent = await sendTelegramMessage(token, chatId, text);
  if (!sent) {
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати. Спробуй ще раз." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
