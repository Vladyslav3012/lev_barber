"use client";

import { useSyncExternalStore } from "react";

type MapEmbedProps = {
  src: string;
  title: string;
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Mount after hydration so Chrome autofill attrs on the iframe can't mismatch SSR. */
export function MapEmbed({ src, title }: MapEmbedProps) {
  const ready = useIsClient();

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
