import Image from "next/image";
import { barbers } from "@/data/barbers";
import { site } from "@/data/site";
import { versionedPublicSrc } from "@/lib/public-image";
import { InstagramIcon } from "./icons";
import { Reveal } from "./Reveal";

const cardSize =
  "flex w-[min(100%,calc(min(62vh,560px)*0.8))] shrink-0 flex-col";

export function Barbers() {
  return (
    <section id="barbers" className="px-5 pt-12 pb-24 md:px-10 md:pt-16 md:pb-32 lg:px-16">
      <Reveal>
        <p className="mb-6 text-[11px] tracking-[0.32em] text-sand uppercase">
          Барбери
        </p>
      </Reveal>
      <Reveal>
        <h2 className="mb-12 max-w-xl font-serif text-3xl font-normal text-mist italic md:mb-16 md:text-4xl">
          Команда, яка створює {site.name}.
        </h2>
      </Reveal>

      <div className="flex flex-col items-center gap-10 md:flex-row md:flex-wrap md:items-stretch md:justify-center md:gap-8 lg:gap-10">
        {barbers.map((barber, index) => {
          const src = versionedPublicSrc(barber.image) ?? barber.image;
          return (
            <Reveal key={barber.name} className={cardSize}>
              <article className="flex h-full flex-col">
                <div className="group relative aspect-[4/5] overflow-hidden bg-[#1c1c1c]">
                  <Image
                    src={src}
                    alt={`${barber.name}, ${barber.role} барбершопу ${site.name} у Львові`}
                    fill
                    sizes="(min-width: 768px) 420px, 100vw"
                    priority={index === 0}
                    className="object-cover object-[center_62%] brightness-[0.97] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-black/14"
                  />
                </div>
                <div className="mt-5 flex items-center gap-1.5">
                  <h3 className="font-serif text-3xl text-mist italic md:text-4xl">
                    {barber.name}
                  </h3>
                  <a
                    href={barber.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 translate-y-[3px] items-center justify-center text-mist/75 transition-colors duration-300 hover:text-sand"
                    aria-label={`Instagram ${barber.name}`}
                  >
                    <InstagramIcon />
                  </a>
                </div>
                <p className="mt-2 text-[11px] tracking-[0.22em] text-sand uppercase">
                  {barber.role}
                </p>
              </article>
            </Reveal>
          );
        })}

        <Reveal className={`${cardSize} md:self-stretch`}>
          <a
            href="#career"
            className="group relative flex aspect-[4/5] h-full flex-col justify-between overflow-hidden border border-sand/35 px-6 py-7 text-center transition-[border-color,background-color] duration-500 hover:border-sand/70 hover:bg-sand/[0.03] md:aspect-auto md:px-8 md:py-8"
          >
            <div
              aria-hidden
              className="career-card-hatch pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="relative mx-auto text-3xl leading-none text-sand/80 transition-transform duration-500 ease-out group-hover:scale-125 group-hover:rotate-90"
            >
              +
            </span>
            <div className="relative flex flex-1 flex-col items-center justify-center px-1">
              <p className="font-serif text-[1.7rem] leading-tight text-mist italic md:text-4xl">
                Це можеш бути ти
              </p>
              <p className="mx-auto mt-4 max-w-[16rem] text-[13px] leading-6 text-mist/70">
                Ми шукаємо барбера, який хоче рости разом із {site.name}.
              </p>
            </div>
            <span className="relative text-[12px] tracking-[0.22em] text-mist/80 uppercase transition-colors duration-300 group-hover:text-sand">
              Стати барбером {site.name} →
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
