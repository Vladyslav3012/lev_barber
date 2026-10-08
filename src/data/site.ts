export const site = {
  name: "LEV BARBER",
  city: "Львів",
  heroEyebrow: "ЛЬВІВ / 2026",
  tagline: "ТВІЙ СТИЛЬ. ТВІЙ БАРБЕР.",
  statement: "Місце, де стрижка — це частина твого стилю.",
  description:
    "Барбершоп «Lev Barber» у Львові. Місце з характером, хорошою атмосферою і сильною стрижкою.",
  address: {
    street: "вул. Івана Франка, 100",
    city: "Львів",
    region: "Львівська область",
    postalCode: "79000",
    country: "UA",
    full: "вул. Івана Франка, 100, Львів, 79000",
  },
  geo: {
    latitude: 49.828373,
    longitude: 24.033341,
  },
  priceRange: "₴₴",
  hours: {
    label: "Щодня 08:00–21:00",
    opens: "08:00",
    closes: "21:00",
    days: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ] as const,
  },
  phone: {
    display: "+380 50 881 43 94",
    href: "tel:+380508814394",
    e164: "+380508814394",
  },
  instagram: {
    handle: "@barbershop_lev",
    href: "https://www.instagram.com/barbershop_lev/",
    label: "Instagram LEV BARBER",
  },
  tiktok: {
    handle: "@lev_barberhop",
    href: "https://www.tiktok.com/@lev_barberhop?_r=1",
    label: "TikTok LEV BARBER",
  },
  booking: {
    href: "https://n1381485.alteg.io/company/1316669/personal/menu?o=",
    label: "Записатися",
    cta: "Записатися онлайн",
  },
  maps: {
    query: "вулиця Івана Франка, 100, Львів, 79000",
    embed:
      "https://maps.google.com/maps?q=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%86%D0%B2%D0%B0%D0%BD%D0%B0%20%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%B0%2C%20100%2C%20%D0%9B%D1%8C%D0%B2%D1%96%D0%B2&z=16&hl=uk&gl=ua&output=embed",
    directions:
      "https://www.google.com/maps/dir/?api=1&hl=uk&destination=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%86%D0%B2%D0%B0%D0%BD%D0%B0%20%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%B0%2C%20100%2C%20%D0%9B%D1%8C%D0%B2%D1%96%D0%B2",
    listing:
      "https://maps.google.com/?hl=uk&q=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%86%D0%B2%D0%B0%D0%BD%D0%B0%20%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%B0%2C%20100%2C%20%D0%9B%D1%8C%D0%B2%D1%96%D0%B2",
  },
  about: [
    "Це барбершоп «Lev Barber» у Львові — не салон «преміум-класу», а місце зі своїм характером. Тут немає зайвого ритуалу. Є майстер, який чує, що тобі потрібно, і стрижка, з якою ти виходиш собою.",
    "Важливі не тренди заради трендів, а відчуття: атмосфера, яка не тисне, розмова без скрипту і робота, яку видно в дзеркалі.",
    "Люди приходять сюди, бо хочуть свого барбера. Не випадкового майстра на годину, а людину, якій можна довірити голову і стиль.",
  ],
  atmosphere: {
    headline: "Комфорт, у якому легко бути собою.",
    paragraphs: [
      "Простір без показухи і зайвого шуму. Сідаєш у крісло, видихаєш і не думаєш, як себе тримати.",
      "Атмосфера тримається на простих речах: світло, музика, темп розмови і відчуття, що ніхто не підганяє.",
      "Приходиш по стрижку — і залишаєшся ще на кілька хвилин, бо тут просто добре.",
    ],
  },
  nav: [
    { href: "#about", label: "Про нас" },
    { href: "#barbers", label: "Барбери" },
    { href: "#atmosphere", label: "Атмосфера" },
    { href: "#contact", label: "Контакти" },
  ],
} as const;
