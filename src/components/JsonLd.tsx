import { site } from "@/data/site";
import { services } from "@/data/services";
import { getSiteUrl } from "@/lib/site-url";

function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd() {
  const origin = getSiteUrl();
  const homeUrl = `${origin}/`;
  const salonId = `${homeUrl}#salon`;
  const websiteId = `${homeUrl}#website`;
  const webpageId = `${homeUrl}#webpage`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HairSalon",
        "@id": salonId,
        name: "Барбершоп Lev Barber",
        description: site.description,
        url: homeUrl,
        image: `${origin}/atmosphere/01.webp`,
        telephone: site.phone.e164,
        priceRange: site.priceRange,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.city,
          addressRegion: site.address.region,
          postalCode: site.address.postalCode,
          addressCountry: site.address.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: site.geo.latitude,
          longitude: site.geo.longitude,
        },
        hasMap: site.maps.listing,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Послуги та ціни LEV BARBER",
          itemListElement: services.map((service) => ({
            "@type": "Offer",
            price: service.price,
            priceCurrency: "UAH",
            url: site.booking.href,
            itemOffered: {
              "@type": "Service",
              name: service.name,
              provider: { "@id": salonId },
            },
          })),
        },
        areaServed: {
          "@type": "City",
          name: site.city,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [...site.hours.days],
          opens: site.hours.opens,
          closes: site.hours.closes,
        },
        sameAs: [site.instagram.href, site.tiktok.href],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: site.name,
        url: homeUrl,
        inLanguage: "uk-UA",
        publisher: { "@id": salonId },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        name: site.seoTitle,
        description: site.description,
        url: homeUrl,
        inLanguage: "uk-UA",
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": salonId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
