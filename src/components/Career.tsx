"use client";

import { FormEvent, useRef, useState } from "react";
import { Reveal } from "./Reveal";
import {
  CAREER_LIMITS,
  PHONE_PREFIX,
  contactError,
  looksLikePhoneInput,
  messageError,
  nameError,
  normalizeContact,
} from "@/lib/career-validation";

type Status = "idle" | "sending" | "ok" | "error";
type FieldName = "name" | "contact" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;

const fieldClass =
  "w-full bg-transparent py-2.5 text-mist outline-none transition-colors placeholder:text-mist/35";

function fieldBorder(hasError: boolean) {
  return hasError
    ? "border border-red-400/80"
    : "border border-transparent border-b-mist/25 focus:border-sand";
}

export function Career() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [contactValue, setContactValue] = useState("");
  const sendingRef = useRef(false);
  const showPhonePrefix = looksLikePhoneInput(contactValue);

  function clearField(name: FieldName) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validate(values: Record<FieldName, string>): FieldErrors {
    const next: FieldErrors = {};
    const nameIssue = nameError(values.name);
    if (nameIssue) next.name = nameIssue;
    const contactIssue = contactError(values.contact);
    if (contactIssue) next.contact = contactIssue;
    const messageIssue = messageError(values.message);
    if (messageIssue) next.message = messageIssue;
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? "").trim(),
      contact: normalizeContact(contactValue),
      message: String(data.get("message") ?? "").trim(),
    };

    const nextErrors = validate(values);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("idle");
      return;
    }

    sendingRef.current = true;
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          website: data.get("website"),
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        sendingRef.current = false;
        setStatus("error");
        setError(payload.error ?? "Не вдалося надіслати. Спробуй ще раз.");
        return;
      }

      setStatus("ok");
      form.reset();
      setContactValue("");
      sendingRef.current = false;
    } catch {
      sendingRef.current = false;
      setStatus("error");
      setError("Немає зв’язку. Спробуй ще раз.");
    }
  }

  return (
    <section id="career" className="px-5 pt-8 pb-24 md:px-10 md:pt-10 md:pb-32 lg:px-16">
      <Reveal>
        <p className="mb-5 text-[11px] tracking-[0.32em] text-sand uppercase">
          Кар’єра
        </p>
      </Reveal>
      <Reveal>
        <h2 className="max-w-3xl text-[8.5vw] leading-[0.95] font-medium tracking-[-0.03em] text-mist uppercase sm:text-5xl md:text-6xl">
          Хочеш стати частиною нашої команди?
        </h2>
      </Reveal>
      <Reveal>
        <p className="mt-5 font-serif text-xl text-mist/80 italic md:text-2xl">
          Ми завжди відкриті до нових талантів.
        </p>
      </Reveal>

      <form
        id="career-form"
        noValidate
        onSubmit={onSubmit}
        className="relative mt-10 grid max-w-xl gap-5 border-t border-sand/20 pt-8"
        suppressHydrationWarning
      >
        <label className="grid gap-1.5">
          <span className="text-[11px] tracking-[0.2em] text-sand uppercase">
            Ім’я
          </span>
          <input
            name="name"
            autoComplete="name"
            maxLength={CAREER_LIMITS.name.max}
            placeholder="Ваше ім’я"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "career-name-error" : undefined}
            onChange={() => clearField("name")}
            suppressHydrationWarning
            className={`${fieldClass} ${fieldBorder(Boolean(fieldErrors.name))}`}
          />
          {fieldErrors.name ? (
            <p id="career-name-error" role="alert" className="text-[12px] text-red-300/90">
              {fieldErrors.name}
            </p>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <span className="text-[11px] tracking-[0.2em] text-sand uppercase">
            Телефон або Instagram
          </span>
          <div
            className={`flex items-baseline gap-1.5 ${fieldBorder(Boolean(fieldErrors.contact))}`}
          >
            {showPhonePrefix ? (
              <span className="shrink-0 py-2.5 pl-0 text-mist/50 select-none">
                {PHONE_PREFIX}
              </span>
            ) : null}
            <input
              name="contact"
              value={contactValue}
              inputMode={showPhonePrefix ? "tel" : "text"}
              autoComplete={showPhonePrefix ? "tel-national" : "username"}
              maxLength={CAREER_LIMITS.contact.max}
              placeholder={
                showPhonePrefix ? "068 000 00 00 або @name" : "@name"
              }
              aria-label={
                showPhonePrefix
                  ? `Телефон, код країни ${PHONE_PREFIX}`
                  : "Телефон або Instagram"
              }
              aria-invalid={Boolean(fieldErrors.contact)}
              aria-describedby={
                fieldErrors.contact ? "career-contact-error" : undefined
              }
              onChange={(event) => {
                setContactValue(event.target.value);
                clearField("contact");
              }}
              suppressHydrationWarning
              className={`${fieldClass} min-w-0 border-0 focus:border-transparent`}
            />
          </div>
          {fieldErrors.contact ? (
            <p
              id="career-contact-error"
              role="alert"
              className="text-[12px] text-red-300/90"
            >
              {fieldErrors.contact}
            </p>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <span className="text-[11px] tracking-[0.2em] text-sand uppercase">
            Про досвід
          </span>
          <textarea
            name="message"
            rows={3}
            maxLength={CAREER_LIMITS.message.max}
            placeholder="Розкажи, скільки працюєш і що вмієш найкраще"
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={
              fieldErrors.message ? "career-message-error" : undefined
            }
            onChange={() => clearField("message")}
            suppressHydrationWarning
            className={`${fieldClass} resize-none ${fieldBorder(Boolean(fieldErrors.message))}`}
          />
          {fieldErrors.message ? (
            <p
              id="career-message-error"
              role="alert"
              className="text-[12px] text-red-300/90"
            >
              {fieldErrors.message}
            </p>
          ) : null}
        </label>
        {/* Honeypot: off-screen (not display:none) so naive bots still fill it. */}
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
          suppressHydrationWarning
        />

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-2 justify-self-start border border-mist/45 px-7 py-3.5 text-[12px] tracking-[0.2em] text-mist/90 uppercase transition-colors duration-300 hover:border-mist/70 hover:bg-mist/10 hover:text-mist disabled:opacity-50"
        >
          {status === "sending" ? "Надсилаємо…" : "Стати барбером →"}
        </button>

        {status === "ok" ? (
          <p role="status" className="text-sm text-sand">
            Дякуємо. Напишемо тобі.
          </p>
        ) : null}
        {status === "error" ? (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
