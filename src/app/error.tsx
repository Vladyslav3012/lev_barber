"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/StatusPage";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(
      "[page-error]",
      error.digest ?? "no-digest",
      error.name,
    );
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="Щось пішло не так."
      description="Сторінка тимчасово недоступна. Спробуй ще раз трохи пізніше."
      primary={{ kind: "button", label: "Спробувати ще", onClick: retry }}
    />
  );
}
