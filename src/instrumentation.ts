/**
 * Fail fast in production if the career form cannot deliver to Telegram.
 * Compose also requires these vars (`:?`); this catches non-compose starts.
 * Local `next dev` stays usable without Telegram (API returns 503).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required in production (career form).",
    );
  }
}
