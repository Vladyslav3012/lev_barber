"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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
  const shellRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const el = shellRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);

  if (!ready) {
    return (
      <div
        className="map-embed h-64 w-full lg:h-full lg:min-h-[420px]"
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={shellRef}
      className="map-embed h-64 w-full lg:h-full lg:min-h-[420px]"
    >
      {inView ? (
        <iframe
          title={title}
          src={src}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : null}
    </div>
  );
}
