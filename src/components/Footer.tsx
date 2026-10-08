import { site } from "@/data/site";

const footerNav = [
  ...site.nav,
  { href: "#career", label: "Кар’єра" },
];

export function Footer() {
  return (
    <footer className="border-t border-sand/20 px-5 pt-16 pb-7 md:px-10 md:pt-20 md:pb-8 lg:px-16">
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-12 lg:gap-8">
        <div className="col-span-2 lg:col-span-5">
          <a
            href="#top"
            className="text-[13px] font-medium tracking-[0.22em] text-mist uppercase"
          >
            {site.name}
          </a>
          <p className="mt-4 hidden max-w-sm font-serif text-[1.65rem] leading-snug text-mist italic md:block md:text-3xl">
            {site.statement}
          </p>
        </div>

        <nav aria-label="Футер" className="lg:col-span-3">
          <p className="mb-4 text-[11px] tracking-[0.32em] text-sand uppercase">
            Меню
          </p>
          <ul className="grid grid-cols-1 gap-3">
            {footerNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm tracking-[0.04em] text-mist/80 transition-colors duration-300 hover:text-sand"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className="mb-4 text-[11px] tracking-[0.32em] text-sand uppercase">
            Візит
          </p>
          <div className="space-y-1 text-sm leading-7 text-mist/80">
            <p>{site.address.street}</p>
            <p>
              {site.city}, {site.address.postalCode}
            </p>
            <p>{site.hours.label}</p>
            <a
              href={site.phone.href}
              className="block text-mist transition-colors hover:text-sand"
            >
              {site.phone.display}
            </a>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12px] tracking-[0.16em] text-mist/75 uppercase">
            <a
              href={site.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-sand"
            >
              Instagram
            </a>
            <a
              href={site.tiktok.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-sand"
            >
              TikTok
            </a>
            <a
              href={site.maps.listing}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-sand"
            >
              Google Maps
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between gap-4 border-t border-white/5 pt-6 text-[11px] tracking-[0.16em] text-stone uppercase">
        <p>© 2026 {site.name}</p>
        <p>{site.city}</p>
      </div>
    </footer>
  );
}
