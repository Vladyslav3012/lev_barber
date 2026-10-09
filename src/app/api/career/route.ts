import { NextRequest, NextResponse } from "next/server";
import {
  BodyTooLargeError,
  careerOriginContext,
  clientIp,
  isAllowedOrigin,
  readCareerJsonBody,
} from "@/lib/career-request";
import { careerFieldsSchema } from "@/lib/career-fields-schema";
import { formatCareerTelegramHtml } from "@/lib/career-validation";

const WINDOW_MS = 60 * 1000;
/** Successful Telegram sends per IP per window (validation failures do not count). */
const MAX_REQUESTS = 3;
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
  if (!isAllowedOrigin(request.headers, careerOriginContext(request.headers))) {
    return NextResponse.json(
      { ok: false, error: "Некоректний запит." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readCareerJsonBody(request);
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

  const ip = clientIp(request.headers);
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
