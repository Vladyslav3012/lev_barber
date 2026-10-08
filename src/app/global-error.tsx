"use client";

import { Cormorant_Garamond, Manrope } from "next/font/google";
import { useEffect } from "react";
import { StatusPage } from "@/components/StatusPage";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

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
      className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}
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
