"use client";

import { useEffect, useState } from "react";

type MapEmbedProps = {
  src: string;
  title: string;
};

/** Mount after hydration so Chrome autofill attrs on the iframe can't mismatch SSR. */
export function MapEmbed({ src, title }: MapEmbedProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        className="map-embed h-64 w-full lg:h-full lg:min-h-[420px]"
        aria-hidden
      />
    );
  }

  return (
    <iframe
      title={title}
      src={src}
      className="map-embed h-64 w-full lg:h-full lg:min-h-[420px]"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
