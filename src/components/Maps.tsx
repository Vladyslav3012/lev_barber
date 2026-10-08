import { site } from "@/data/site";
import { MapEmbed } from "./MapEmbed";
import { Reveal } from "./Reveal";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 h-4 w-4 shrink-0">
      <path
        d="M12 21s6.5-5.2 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.8 6.5 11 6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 h-4 w-4 shrink-0">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 h-4 w-4 shrink-0">
      <path
        d="M8.2 4.8h2.1l1.1 3.2-1.4 1.4a11.5 11.5 0 0 0 5.6 5.6l1.4-1.4 3.2 1.1v2.1c0 .7-.5 1.3-1.2 1.4A14.7 14.7 0 0 1 4.4 6c.1-.7.7-1.2 1.4-1.2Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RouteArrow() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="h-2.5 w-2.5 shrink-0"
    >
      <path
        d="M2.5 9.5 9.5 2.5M4 2.5h5.5V8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Maps() {
  return (
    <section id="contact" className="px-5 pt-6 pb-16 md:px-10 md:pt-8 md:pb-20 lg:px-16">
      <Reveal>
        <div className="overflow-hidden border border-sand/25">
          <div className="grid lg:grid-cols-12">
            <div className="flex flex-col justify-between px-5 py-8 md:px-8 md:py-10 lg:col-span-5">
              <div>
                <p className="text-[11px] tracking-[0.32em] text-sand uppercase">
                  Контакти
                </p>
                <h2 className="mt-4 font-serif text-4xl leading-[1.1] text-mist italic md:text-5xl">
                  Чекаємо тебе.
                </h2>
              </div>

              <div className="mt-8 space-y-4 text-[15px] leading-7 text-mist/80">
                <div className="flex gap-3">
                  <span className="text-sand/70">
                    <PinIcon />
                  </span>
                  <div>
                    <p>{site.address.street}</p>
                    <p>
                      {site.city}, {site.address.postalCode}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-sand/70">
                    <ClockIcon />
                  </span>
                  <p>{site.hours.label}</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-sand/70">
                    <PhoneIcon />
                  </span>
                  <a
                    href={site.phone.href}
                    className="text-mist transition-colors hover:text-sand"
                  >
                    {site.phone.display}
                  </a>
                </div>
              </div>

              <div className="mt-10 flex flex-col">
                <a
                  href={site.maps.directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 border border-mist/45 px-6 py-3.5 text-[11px] tracking-[0.2em] text-mist/90 uppercase transition-colors duration-300 hover:border-mist/70 hover:bg-mist/10 hover:text-mist"
                >
                  Прокласти маршрут
                  <RouteArrow />
                </a>
                <a
                  href={site.phone.href}
                  className="mt-5 inline-flex w-full justify-center border-t border-mist/30 pt-5 text-[11px] tracking-[0.2em] text-mist/80 uppercase transition-colors duration-300 hover:text-mist"
                >
                  Зателефонувати
                </a>
              </div>
            </div>

            <div className="border-t border-sand/25 p-3 md:p-4 lg:col-span-7 lg:border-t-0 lg:border-l lg:border-sand/25 lg:p-5">
              <div className="overflow-hidden rounded-[2px] bg-charcoal">
                <MapEmbed title="Lev Barber на мапі" src={site.maps.embed} />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
