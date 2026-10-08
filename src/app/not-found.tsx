import type { Metadata } from "next";
import { StatusPage } from "@/components/StatusPage";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Такої сторінки немає."
      description="Можливо, посилання застаріле або адресу введено з помилкою. Повернись на головну — там усе про Lev Barber."
    />
  );
}
