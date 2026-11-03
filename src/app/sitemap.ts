import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();

  return [
    {
      url: `${origin}/`,
      images: [
        `${origin}/atmosphere/01.webp`,
        `${origin}/atmosphere/02.webp`,
        `${origin}/atmosphere/03.webp`,
        `${origin}/barbers/bogdan.webp`,
      ],
    },
  ];
}
