import Link from "next/link";
import { site } from "@/data/site";

type StatusPageProps = {
  code: string;
  title: string;
  description: string;
  primary?:
    | { kind: "link"; href: string; label: string }
    | { kind: "button"; label: string; onClick: () => void };
};

export function StatusPage({
  code,
  title,
  description,
  primary = { kind: "link", href: "/", label: "На головну" },
}: StatusPageProps) {
  return (
    <main className="relative flex min-h-[100svh] flex-col justify-center px-5 py-24 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-[11px] tracking-[0.32em] text-sand uppercase">
          {site.name} · {code}
        </p>
        <h1 className="mt-5 font-serif text-4xl leading-tight text-mist italic md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-7 text-mist/75">
          {description}
        </p>

        <div className="mt-10">
          {primary.kind === "link" ? (
            <Link
              href={primary.href}
              className="inline-flex justify-center border border-mist/45 px-7 py-3.5 text-[12px] tracking-[0.2em] text-mist/90 uppercase transition-colors duration-300 hover:border-mist/70 hover:bg-mist/10 hover:text-mist"
            >
              {primary.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={primary.onClick}
              className="inline-flex justify-center border border-mist/45 px-7 py-3.5 text-[12px] tracking-[0.2em] text-mist/90 uppercase transition-colors duration-300 hover:border-mist/70 hover:bg-mist/10 hover:text-mist"
            >
              {primary.label}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
