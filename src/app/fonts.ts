import localFont from "next/font/local";

export const manrope = localFont({
  src: "./fonts/manrope-variable.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const robotoCondensed = localFont({
  src: "./fonts/roboto-condensed-variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-roboto-condensed",
  display: "swap",
  adjustFontFallback: "Arial",
});
