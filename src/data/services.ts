/**
 * Public Altegio menu, verified on 2026-10-26:
 * https://n1381485.alteg.io/company/1316669/personal/select-services
 * Keep this list in sync when the booking menu changes.
 * Single-length clipper cut (400 UAH / 30 min) confirmed by the owner on 2026-11-16.
 */
export const serviceCategories = [
  { id: "haircuts", name: "Стрижки" },
  { id: "haircuts-and-beard", name: "Стрижка + борода" },
  { id: "beard-and-styling", name: "Борода й укладка" },
  { id: "texture-and-color", name: "Завивка й фарбування" },
] as const;

type Service = {
  name: string;
  category: (typeof serviceCategories)[number]["id"];
  mobileName?: string;
  detail?: string;
  price: number;
  duration: string;
};

export const services = [
  {
    name: "Чоловіча стрижка",
    mobileName: "Звичайна",
    category: "haircuts",
    price: 800,
    duration: "1 год",
  },
  {
    name: "Стрижка бороди",
    category: "beard-and-styling",
    price: 600,
    duration: "1 год",
  },
  {
    name: "Стрижка та стрижка бороди",
    mobileName: "Звичайна + борода",
    category: "haircuts-and-beard",
    price: 1100,
    duration: "1 год 15 хв",
  },
  {
    name: "Стрижка під машинку",
    mobileName: "Під машинку",
    category: "haircuts",
    detail: "З переходом від 0 до 10 мм",
    price: 600,
    duration: "35 хв",
  },
  {
    name: "Стрижка під одну насадку",
    mobileName: "Під одну насадку",
    category: "haircuts",
    price: 400,
    duration: "30 хв",
  },
  {
    name: "Подовжена стрижка",
    mobileName: "Подовжена",
    category: "haircuts",
    detail: "80% роботи ножицями",
    price: 900,
    duration: "1 год",
  },
  {
    name: "Подовжена стрижка та стрижка бороди",
    mobileName: "Подовжена + борода",
    category: "haircuts-and-beard",
    price: 1300,
    duration: "1 год 30 хв",
  },
  {
    name: "Дитяча стрижка",
    mobileName: "Дитяча",
    category: "haircuts",
    detail: "До 10 років",
    price: 700,
    duration: "1 год",
  },
  {
    name: "Укладка",
    category: "beard-and-styling",
    price: 300,
    duration: "30 хв",
  },
  {
    name: "Хімічна завивка",
    category: "texture-and-color",
    price: 3500,
    duration: "3 год 30 хв",
  },
  {
    name: "Бразильське фарбування",
    category: "texture-and-color",
    price: 3000,
    duration: "3 год",
  },
] as const satisfies readonly Service[];

export function formatPrice(price: number) {
  return `${new Intl.NumberFormat("uk-UA").format(price)} ₴`;
}
