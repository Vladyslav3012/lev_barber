"use client";

import { useState } from "react";
import { formatPrice, services } from "@/data/services";
import { site } from "@/data/site";

const startingPrice = Math.min(
  ...services
    .filter((service) => service.category === "haircuts")
    .map((service) => service.price),
);

function PhoneLink() {
  return (
    <a
      href={site.phone.href}
      className="whitespace-nowrap text-mist underline decoration-sand/50 underline-offset-4 hover:decoration-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand"
    >
      {site.phone.display}
    </a>
  );
}

const questions = [
  {
    id: "booking",
    question: "Як записатися?",
    answer: (
      <>
        <ol className="list-decimal space-y-2 pl-5 marker:text-sand">
          <li>Натисни «Записатися» та обери послугу й барбера.</li>
          <li>Обери зручну дату та вільний час.</li>
          <li>Вкажи контактні дані й підтвердь запис.</li>
        </ol>
        <p className="mt-4">
          Також можеш записатися телефоном: <PhoneLink />.
        </p>
      </>
    ),
  },
  {
    id: "price",
    question: "Скільки коштує стрижка?",
    answer: (
      <p>
        Стрижки — від {formatPrice(startingPrice)}. Вартість залежить від обраної
        послуги та майстра. Переглянь розділ «Послуги та ціни», а актуальну ціну
        перевір під час онлайн-запису.
      </p>
    ),
  },
  {
    id: "duration",
    question: "Скільки часу займає візит?",
    answer: (
      <p>
        Чоловіча стрижка зазвичай займає близько години, а стрижка під одну
        насадку — 30 хвилин. Тривалість інших послуг дивись у меню онлайн-запису,
        щоб спланувати свій візит.
      </p>
    ),
  },
  {
    id: "children",
    question: "Чи робите дитячі стрижки?",
    answer: (
      <p>
        Так, у нас є дитяча стрижка для дітей до 10 років. Якщо маєш запитання
        перед першим візитом, зателефонуй: <PhoneLink />.
      </p>
    ),
  },
  {
    id: "choice",
    question: "Що обрати, якщо ще не визначився зі стрижкою?",
    answer: (
      <p>
        Зателефонуй нам і розкажи, який результат хочеш отримати. Допоможемо
        обрати послугу та підкажемо, скільки часу закласти на візит: <PhoneLink />.
      </p>
    ),
  },
  {
    id: "reschedule",
    question: "Як перенести або скасувати запис?",
    answer: (
      <p>
        Зателефонуй нам: <PhoneLink />. Повідом про зміну планів якомога раніше,
        щоб ми могли запропонувати цей час іншому гостю.
      </p>
    ),
  },
];

export function Faq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="px-5 py-12 md:px-10 md:py-24 lg:px-16"
    >
      <div className="grid gap-6 border-t border-sand/25 pt-8 md:gap-10 md:pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20 lg:pt-14">
        <div className="max-w-md">
          <h2
            id="faq-heading"
            className="font-display text-4xl leading-[1.1] font-medium tracking-[-0.02em] text-mist md:text-5xl"
          >
            Перед візитом
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-6 text-mist/75 md:mt-6 md:text-[15px] md:leading-7">
            Відповіді на запитання про запис і послуги.
          </p>
        </div>

        <div className="border-t border-sand/25">
          {questions.map(({ id, question, answer }) => {
            const isOpen = openId === id;
            const triggerId = `faq-trigger-${id}`;
            const panelId = `faq-panel-${id}`;

            return (
              <div key={id} className="border-b border-sand/25">
                <h3>
                  <button
                    type="button"
                    id={triggerId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() =>
                      setOpenId((current) => current === id ? null : id)
                    }
                    className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand md:min-h-20 md:py-6"
                  >
                    <span className="font-display text-[21px] leading-tight font-medium tracking-[-0.02em] text-mist md:text-[1.65rem]">
                      {question}
                    </span>
                    <span
                      aria-hidden
                      className={`relative h-4 w-4 shrink-0 text-sand before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:bg-current after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:bg-current after:transition-transform after:duration-300 motion-reduce:after:transition-none ${isOpen ? "after:scale-y-0" : "after:scale-y-100"}`}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div
                    className="min-h-0 overflow-hidden"
                    inert={!isOpen ? true : undefined}
                  >
                    <div className="max-w-xl pb-6 pr-6 text-sm leading-7 text-mist/80 md:pb-7 md:pr-10 md:text-[15px]">
                      {answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
