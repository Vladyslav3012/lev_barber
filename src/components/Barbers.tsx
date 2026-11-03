import Image from "next/image";
import { barbers } from "@/data/barbers";
import { site } from "@/data/site";
import { versionedPublicSrc } from "@/lib/public-image";
import { Reveal } from "./Reveal";

export function Barbers() {
  return (
    <section
      id="barbers"
      aria-labelledby="barbers-heading"
      className="px-5 pt-14 pb-8 md:px-10 md:pt-20 md:pb-10 lg:px-16"
    >
      <Reveal>
        <h2
          id="barbers-heading"
          className="mb-9 max-w-xl font-display text-3xl leading-tight font-medium tracking-[-0.02em] text-mist md:mb-10 md:text-4xl"
        >
          Команда, яка створює {site.name}.
        </h2>
      </Reveal>

      <Reveal>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:gap-y-10">
          {barbers.map((barber) => {
            const src = versionedPublicSrc(barber.image) ?? barber.image;
            return (
              <li key={barber.name} className="min-w-0">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#1c1c1c] md:aspect-auto md:h-[min(78vh,42rem)] lg:h-[min(82vh,48rem)]">
                  <Image
                    src={src}
                    alt={`${barber.name}, ${barber.role} барбершопу ${site.name} у Львові`}
                    fill
                    sizes="(min-width: 768px) 45vw, 45vw"
                    className="object-cover object-[center_62%]"
                  />
                </div>
                <h3 className="mt-3 font-display text-2xl leading-tight font-medium text-mist md:text-[1.75rem]">
                  {barber.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-mist/65">
                  {barber.role}
                </p>
                <a
                  href={barber.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-11 items-center text-sm text-mist/70 transition-colors hover:text-mist focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand"
                >
                  Instagram
                </a>
              </li>
            );
          })}
        </ul>

        <a
          href="#career"
          className="mt-10 inline-flex min-h-11 items-center text-sm text-mist/55 transition-colors hover:text-mist focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand md:mt-12"
        >
          Відкрита вакансія барбера →
        </a>
      </Reveal>
    </section>
  );
}
