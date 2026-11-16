"use client";

import { useState } from "react";
import { services, serviceCategories, formatPrice } from "@/data/services";

export function Services() {
  const [openId, setOpenId] = useState<string | null>(
    serviceCategories[0]?.id ?? null,
  );

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="px-5 py-12 md:px-10 md:py-24 lg:px-16"
    >
      <div className="grid gap-6 border-t border-sand/25 pt-8 md:gap-10 md:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20 lg:pt-14">
        <div className="max-w-md">
          <h2
            id="services-heading"
            className="font-display text-4xl leading-[1.1] font-medium tracking-[-0.02em] text-mist md:text-5xl"
          >
            Послуги та ціни
          </h2>
          <p className="mt-3 text-sm leading-6 text-mist/75 md:hidden">
            Відкрий потрібну категорію — обери свій варіант.
          </p>
          <p className="mt-6 hidden text-[15px] leading-7 text-mist/80 md:block">
            Чоловічі стрижки, стрижка бороди та догляд за стилем у Львові на
            вул. Івана Франка, 100. Обирай послугу й зручний час у нашому
            онлайн-записі.
          </p>
        </div>

        <div>
          <div className="border-t border-sand/25">
            {serviceCategories.map((category) => {
              const items = services.filter(
                (service) => service.category === category.id,
              );
              const startingPrice = Math.min(
                ...items.map((service) => service.price),
              );
              const isOpen = openId === category.id;
              const panelId = `services-panel-${category.id}`;
              const triggerId = `services-trigger-${category.id}`;

              return (
                <div key={category.id} className="border-b border-sand/25">
                  <h3 className="font-normal">
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() =>
                        setOpenId((current) =>
                          current === category.id ? null : category.id,
                        )
                      }
                      className="grid min-h-16 w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand md:min-h-18 md:gap-x-4 md:py-5"
                    >
                      <span
                        aria-hidden
                        className={`w-3 font-display text-xl leading-none transition-colors duration-300 motion-reduce:transition-none md:text-2xl ${
                          isOpen ? "text-mist" : "text-mist/75"
                        }`}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                      <span
                        className={`font-display text-[21px] leading-tight font-medium tracking-[-0.02em] transition-colors duration-300 motion-reduce:transition-none md:text-[1.65rem] ${
                          isOpen ? "text-mist" : "text-mist/80"
                        }`}
                      >
                        {category.name}
                      </span>
                      <span
                        className={`text-xs whitespace-nowrap tabular-nums transition-colors duration-300 motion-reduce:transition-none md:text-sm ${
                          isOpen ? "text-mist" : "text-mist/80"
                        }`}
                      >
                        від {formatPrice(startingPrice)}
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    aria-hidden={!isOpen}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <ul
                        className="pb-3 pl-6 md:pb-4 md:pl-7"
                        inert={!isOpen ? true : undefined}
                      >
                        {items.map((service) => (
                          <li
                            key={service.name}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 border-t border-sand/10 py-3.5 md:gap-x-8 md:py-4"
                          >
                            <div>
                              <h4 className="text-sm leading-5 font-medium text-mist/85 md:text-[15px] md:leading-6">
                                <span className="md:hidden">
                                  {"mobileName" in service
                                    ? service.mobileName
                                    : service.name}
                                </span>
                                <span className="hidden md:inline">
                                  {service.name}
                                </span>
                              </h4>
                              {"detail" in service && (
                                <p className="mt-1 text-xs leading-5 text-mist/75 md:text-sm md:leading-6">
                                  {service.detail}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm leading-5 whitespace-nowrap text-mist tabular-nums md:text-[15px] md:leading-6">
                                {formatPrice(service.price)}
                              </p>
                              <p className="mt-1 text-xs leading-5 whitespace-nowrap text-mist/75 md:text-sm md:leading-6">
                                {service.duration}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-5 text-mist/65 md:mt-5 md:leading-6">
            <span className="md:hidden">
              Актуальну ціну й тривалість перевіряй під час запису.
            </span>
            <span className="hidden md:inline">
              Ціни та тривалість можуть відрізнятися залежно від майстра.
              Актуальні умови перевіряй під час онлайн-запису.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
