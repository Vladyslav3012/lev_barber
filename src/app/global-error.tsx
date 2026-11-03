"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/StatusPage";
import { manrope, robotoCondensed } from "./fonts";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(
      "[global-error]",
      error.digest ?? "no-digest",
      error.name,
    );
  }, [error]);

  return (
    <html
      lang="uk"
      className={`${manrope.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-charcoal font-sans text-mist">
        <title>Помилка — LEV BARBER</title>
        <div className="grain" aria-hidden />
        <StatusPage
          code="500"
          title="Щось пішло не так."
          description="Сторінка тимчасово недоступна. Спробуй ще раз трохи пізніше."
          primary={{ kind: "button", label: "Спробувати ще", onClick: retry }}
        />
      </body>
    </html>
  );
}
