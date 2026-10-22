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
type RateLimitState = { sentAt: number[]; pending: number };
const hits = new Map<string, RateLimitState>();

function pruneHits(now: number) {
  for (const [ip, state] of hits) {
    state.sentAt = state.sentAt.filter((time) => now - time < WINDOW_MS);
    if (state.sentAt.length === 0 && state.pending === 0) hits.delete(ip);
  }
}

/**
 * Reserve a slot synchronously before awaiting Telegram so concurrent requests
 * from the same IP count against the cap. Failed sends release their slot.
 */
function reserveSend(ip: string) {
  const now = Date.now();
  if (hits.size > 500) pruneHits(now);

  const state = hits.get(ip) ?? { sentAt: [], pending: 0 };
  state.sentAt = state.sentAt.filter((time) => now - time < WINDOW_MS);
  if (state.sentAt.length + state.pending >= MAX_REQUESTS) return null;

  state.pending += 1;
  hits.set(ip, state);

  let settled = false;
  return {
    commit() {
      if (settled) return;
      settled = true;
      state.pending -= 1;
      state.sentAt.push(Date.now());
    },
    release() {
      if (settled) return;
      settled = true;
      state.pending -= 1;
      if (state.sentAt.length === 0 && state.pending === 0) hits.delete(ip);
    },
  };
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

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.error("Career form misconfigured: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing");
    return NextResponse.json(
      { ok: false, error: "Форма тимчасово недоступна. Напиши в Instagram." },
      { status: 503 },
    );
  }

  const ip = clientIp(request.headers);
  const reservation = reserveSend(ip);
  if (!reservation) {
    return NextResponse.json(
      { ok: false, error: "Забагато спроб. Спробуй пізніше." },
      { status: 429 },
    );
  }

  const text = formatCareerTelegramHtml(parsed.data);
  const sent = await sendTelegramMessage(token, chatId, text);
  if (!sent) {
    reservation.release();
    return NextResponse.json(
      { ok: false, error: "Не вдалося надіслати. Спробуй ще раз." },
      { status: 502 },
    );
  }

  reservation.commit();
  return NextResponse.json({ ok: true });
}
