import { z } from "zod";

const UA_PHONE = /^\+380\d{9}$/;
const INSTAGRAM = /^[a-zA-Z0-9._]{2,30}$/;

export const PHONE_PREFIX = "+38";

export const CAREER_LIMITS = {
  name: { min: 2, max: 80 },
  contact: { max: 120 },
  message: { min: 10, max: 2000 },
} as const;

const trimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.string(),
);

function compactPhone(value: string) {
  return value.replace(/[\s()-]/g, "");
}

export function looksLikePhoneInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/[a-zA-Z@_/]/.test(trimmed) || /instagram\.com/i.test(trimmed)) {
    return false;
  }
  return /^\+?[\d\s()-]+$/.test(trimmed);
}

/** Normalize pasted Instagram URLs / @handles to a bare username. */
export function instagramHandle(value: string) {
  let handle = value.trim();

  handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  handle = handle.replace(/^@/, "");
  // Drop query/hash and any path after the username (reels, posts, etc.)
  handle = handle.split(/[/?#]/)[0] ?? "";
  handle = handle.replace(/\/+$/, "");

  return handle;
}

/**
 * Phone field shows a fixed +38 prefix; user types 068… .
 * Instagram is entered as @name / URL without the prefix.
 */
export function normalizeContact(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (!looksLikePhoneInput(trimmed)) {
    return trimmed;
  }

  let compact = compactPhone(trimmed);
  if (compact.startsWith("+")) compact = compact.slice(1);

  // Full number pasted into the local field: 380XXXXXXXXX
  if (/^380\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  // Accidental +38 already included with national 0… → 38068…
  if (/^38\d{10}$/.test(compact)) {
    return `+${compact}`;
  }

  // National format 0XXXXXXXXX → +380XXXXXXXXX
  if (/^0\d{9}$/.test(compact)) {
    return `${PHONE_PREFIX}${compact}`;
  }

  // 9 digits without leading 0
  if (/^\d{9}$/.test(compact)) {
    return `+380${compact}`;
  }

  return `${PHONE_PREFIX}${compact}`;
}

export function contactError(contact: string) {
  const normalized = normalizeContact(contact);

  if (!normalized) {
    return "Вкажи телефон або нік в Instagram.";
  }

  if (normalized.length > CAREER_LIMITS.contact.max) {
    return "Занадто довгий контакт.";
  }

  if (looksLikePhoneInput(normalized) || UA_PHONE.test(compactPhone(normalized))) {
    if (!UA_PHONE.test(compactPhone(normalized))) {
      return "Вкажи номер як 068 000 00 00.";
    }
    return null;
  }

  if (!INSTAGRAM.test(instagramHandle(normalized))) {
    return "Вкажи телефон (068…) або нік в Instagram, наприклад @name.";
  }

  return null;
}

/** Letters (any script) plus spaces, hyphen, apostrophe — matches the form copy. */
const NAME_PATTERN =
  /^[\p{L}\p{M}]+(?:[\s'\u2019.-]+[\p{L}\p{M}]+)*$/u;

export function nameError(name: string) {
  if (name.length < CAREER_LIMITS.name.min) {
    return "Вкажи ім’я — мінімум 2 літери.";
  }
  if (name.length > CAREER_LIMITS.name.max) {
    return "Ім’я занадто довге.";
  }
  const letters = name.match(/\p{L}/gu) ?? [];
  if (letters.length < CAREER_LIMITS.name.min || !NAME_PATTERN.test(name)) {
    return "Вкажи ім’я — мінімум 2 літери.";
  }
  return null;
}

export function messageError(message: string) {
  if (message.length < CAREER_LIMITS.message.min) {
    return "Напиши кілька речень про свій досвід.";
  }
  if (message.length > CAREER_LIMITS.message.max) {
    return "Текст занадто довгий.";
  }
  return null;
}

/** Flatten newlines in structured Telegram fields so they can’t spoof labels. */
export function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Escape user text for Telegram `parse_mode: "HTML"`. */
export function escapeTelegramHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function formatCareerTelegramHtml(fields: {
  name: string;
  contact: string;
  message: string;
}) {
  return [
    "<b>Нова заявка щоб стати барбером</b>",
    `Ім’я: ${escapeTelegramHtml(singleLine(fields.name))}`,
    `Контакт: ${escapeTelegramHtml(singleLine(fields.contact))}`,
    "",
    escapeTelegramHtml(fields.message),
  ].join("\n");
}

/**
 * Server-side career payload. Keeps the same Ukrainian field errors as the form.
 * Honeypot (`website`) is checked separately before this schema runs.
 */
export const careerFieldsSchema = z.object({
  name: trimmedString.superRefine((value, ctx) => {
    const error = nameError(value);
    if (error) ctx.addIssue({ code: "custom", message: error });
  }),
  contact: trimmedString
    .transform((value) => normalizeContact(value))
    .superRefine((value, ctx) => {
      const error = contactError(value);
      if (error) ctx.addIssue({ code: "custom", message: error });
    }),
  message: trimmedString.superRefine((value, ctx) => {
    const error = messageError(value);
    if (error) ctx.addIssue({ code: "custom", message: error });
  }),
});

export type CareerFields = z.infer<typeof careerFieldsSchema>;
