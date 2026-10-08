import Image from "next/image";
import { site } from "@/data/site";
import { versionedPublicSrc } from "@/lib/public-image";
import { Reveal } from "./Reveal";

const FRAMES = [
  {
    file: "01.jpg",
    className: "aspect-[16/9] w-full",
    alt: "Атмосфера барбершопу Lev Barber",
  },
  {
    file: "02.jpg",
    className: "aspect-[4/5] w-full",
    alt: "Інтер’єр барбершопу Lev Barber",
  },
  {
    file: "03.jpg",
    className: "aspect-[4/5] w-full",
    alt: "Деталі простору Lev Barber",
  },
] as const;

function Frame({
  className,
  src,
  alt,
}: {
  className: string;
  src: string | null;
  alt: string;
}) {
  return (
    <figure
      className={`relative overflow-hidden border border-sand/20 bg-[#1d1d1d] ${className}`}
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover brightness-[0.97]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/14"
          />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(196,181,160,0.05),transparent_45%)]" />
          <figcaption className="absolute inset-0 flex items-center justify-center text-[11px] tracking-[0.35em] text-sand/55 uppercase">
            Скоро
          </figcaption>
        </>
      )}
    </figure>
  );
}

export function Atmosphere() {
  const frames = FRAMES.map((frame) => ({
    ...frame,
    src: versionedPublicSrc(`/atmosphere/${frame.file}`),
  }));

  return (
    <section id="atmosphere" className="px-5 py-8 md:px-10 md:py-16 lg:px-16">
      <Reveal>
        <p className="mb-10 text-[11px] tracking-[0.32em] text-sand uppercase">
          Атмосфера
        </p>
      </Reveal>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-start lg:gap-16 xl:gap-24">
        <Reveal className="mb-8 max-w-xl lg:hidden">
          <h2 className="font-serif text-3xl leading-tight text-mist italic">
            {site.atmosphere.headline}
          </h2>
          <div className="mt-6 space-y-4 text-[15px] leading-7 text-mist/78">
            {site.atmosphere.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-4 md:gap-5">
          <Reveal>
            <Frame
              className={frames[0].className}
              src={frames[0].src}
              alt={frames[0].alt}
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <Reveal>
              <Frame
                className={frames[1].className}
                src={frames[1].src}
                alt={frames[1].alt}
              />
            </Reveal>
            <Reveal>
              <Frame
                className={frames[2].className}
                src={frames[2].src}
                alt={frames[2].alt}
              />
            </Reveal>
          </div>
        </div>

        <div className="hidden lg:sticky lg:top-28 lg:block lg:pt-1">
          <h2 className="font-serif text-3xl leading-tight text-mist italic xl:text-[2.5rem]">
            {site.atmosphere.headline}
          </h2>
          <div className="mt-8 space-y-5 text-[15px] leading-7 text-mist/78 xl:text-base">
            {site.atmosphere.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
