export const site = {
  name: "LEV BARBER",
  city: "Львів",
  seoTitle: "Барбершоп Львів. Стрижки та борода | Lev Barber",
  tagline: "ТВІЙ СТИЛЬ. ТВІЙ БАРБЕР.",
  statement: "Місце, де стрижка — це частина твого стилю.",
  description:
    "Lev Barber барбершоп у Львові, вул. Івана Франка, 100. Чоловічі й дитячі стрижки, стрижка бороди. Ціни та онлайн-запис. Щодня 10:00–21:00.",
  address: {
    street: "вул. Івана Франка, 100",
    city: "Львів",
    region: "Львівська область",
    postalCode: "79000",
    country: "UA",
  },
  geo: {
    latitude: 49.828373,
    longitude: 24.033341,
  },
  priceRange: "₴₴",
  hours: {
    label: "Щодня 10:00–21:00",
    opens: "10:00",
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
    href: "https://www.tiktok.com/@lev_barberhop",
    label: "TikTok LEV BARBER",
  },
  booking: {
    href: "https://n1381485.alteg.io/company/1316669/personal/menu",
    cta: "Записатися онлайн",
  },
  maps: {
    embed:
      "https://maps.google.com/maps?q=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%86%D0%B2%D0%B0%D0%BD%D0%B0%20%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%B0%2C%20100%2C%20%D0%9B%D1%8C%D0%B2%D1%96%D0%B2&z=16&hl=uk&gl=ua&output=embed",
    directions:
      "https://www.google.com/maps/dir/?api=1&hl=uk&destination=%D0%B2%D1%83%D0%BB%D0%B8%D1%86%D1%8F%20%D0%86%D0%B2%D0%B0%D0%BD%D0%B0%20%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%B0%2C%20100%2C%20%D0%9B%D1%8C%D0%B2%D1%96%D0%B2",
    listing:
      "https://www.google.com/maps/place/%D0%91%D0%B0%D1%80%D0%B1%D0%B5%D1%80%D1%88%D0%BE%D0%BF+%C2%AB+Lev+Barber%C2%BB/data=!4m2!3m1!1s0x0:0x2567e1cbf7341bb5",
  },
  about: [
    "Цей барбершоп «Lev Barber» у Львові, місце зі своїм характером. Тут немає зайвого ритуалу. Є майстер, який чує, що тобі потрібно, і стрижка, з якою ти виходиш собою.",
    "Важливі не тренди заради трендів, а відчуття: атмосфера, яка не тисне, розмова без скрипту і робота, яку видно в дзеркалі.",
    "Люди приходять сюди, бо хочуть свого барбера. Не випадкового майстра на годину, а людину, якій можна довірити голову і стиль.",
  ],
  atmosphere: {
    headline: "Комфорт, у якому легко бути собою.",
    paragraphs: [
      "Сюди заходять відпочити від вулиці. Тиха музика, зручне крісло й барбер, який не поспішає.",
      "Можеш поговорити або помовчати — як зручніше. Покинеш місце зі стрижкою, яку хотів.",
    ],
  },
  nav: [
    { href: "#about", label: "Про нас" },
    { href: "#barbers", label: "Барбери" },
    { href: "#services", label: "Послуги та ціни" },
    { href: "#atmosphere", label: "Атмосфера" },
    { href: "#contact", label: "Контакти" },
  ],
} as const;
