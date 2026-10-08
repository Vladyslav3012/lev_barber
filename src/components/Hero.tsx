"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { latchTapFill } from "@/lib/latch-tap";

const HERO_POSTER = "/hero-poster.v1.jpg";
const HERO_VIDEO = "/hero.v1.mp4";

type NetworkConnection = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function networkConnection(): NetworkConnection | undefined {
  const nav = navigator as Navigator & {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

/**
 * Skip the 2.6MB autoplay file when the user/network asks for less media:
 * reduced motion, Save-Data, or very slow cellular.
 * Phones still play — we only defer attaching <source> so the poster wins LCP.
 */
function shouldPlayHeroVideo() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  const conn = networkConnection();
  if (conn?.saveData) return false;
  const type = conn?.effectiveType;
  if (type === "slow-2g" || type === "2g") return false;
  return true;
}

/** True for phones/tablets — defer video attach so poster paints first. */
function prefersDeferredHeroVideo() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function CtaArrow() {
  return (
    <svg
      className="hero-cta-arrow"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 9.5 9.5 2.5M4 2.5h5.5V8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function readScrollY() {
  return Math.max(
    window.scrollY,
    window.pageYOffset || 0,
    document.documentElement.scrollTop,
    document.body.scrollTop,
    document.scrollingElement?.scrollTop ?? 0,
    0,
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const cueWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Start without <source> so reduced-motion / first paint never pull the 2.6MB file.
  const [playVideo, setPlayVideo] = useState(false);

  // Lock hero height once so mobile browser chrome show/hide doesn't resize the section.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const lockHeight = () => {
      const height = Math.round(
        window.visualViewport?.height ?? window.innerHeight,
      );
      section.style.height = `${height}px`;
    };

    lockHeight();
    window.addEventListener("orientationchange", lockHeight);
    return () => window.removeEventListener("orientationchange", lockHeight);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const conn = networkConnection();
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const enable = () => {
      if (!shouldPlayHeroVideo()) {
        setPlayVideo(false);
        return;
      }
      setPlayVideo(true);
    };

    const sync = () => {
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
        idleId = undefined;
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (!shouldPlayHeroVideo()) {
        setPlayVideo(false);
        return;
      }

      // Desktop: attach immediately after hydration.
      // Coarse pointer: wait a tick so poster/LCP isn't fighting the 2.6MB fetch.
      if (prefersDeferredHeroVideo()) {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(enable, { timeout: 1200 });
        } else {
          timeoutId = setTimeout(enable, 400);
        }
        return;
      }
      enable();
    };

    sync();
    motionQuery.addEventListener("change", sync);
    conn?.addEventListener?.("change", sync);
    return () => {
      motionQuery.removeEventListener("change", sync);
      conn?.removeEventListener?.("change", sync);
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playVideo) return;

    const tryPlay = () => {
      void video.play().catch(() => {
        // Autoplay can still be blocked; poster remains visible.
      });
    };

    // play() right after <source> mounts often races the buffer and was
    // swallowed — video then never started. Retry when data is ready.
    video.load();
    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [playVideo]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Scale + parallax reads as a zoom when the mobile URL bar collapses.
    if (window.matchMedia("(pointer: coarse)").matches) {
      frame.style.transform = "none";
      return;
    }

    const maxOffset = window.innerHeight;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const offset = Math.min(readScrollY(), maxOffset);
        frame.style.transform = `translate3d(0, ${offset * 0.18}px, 0) scale(1.08)`;
        ticking = false;
      });
    };

    frame.style.transform = "translate3d(0, 0, 0) scale(1.08)";
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  // JS fallback when CSS scroll-timeline is unavailable (timeline handles mobile/ngrok).
  useEffect(() => {
    const wrap = cueWrapRef.current;
    if (!wrap) return;
    if (
      typeof CSS !== "undefined" &&
      CSS.supports?.("animation-timeline", "scroll()")
    ) {
      return;
    }

    let hidden = false;
    const sync = () => {
      const y = window.scrollY;
      const next = hidden ? y > 8 : y > 40;
      if (next === hidden) return;
      hidden = next;
      wrap.classList.toggle("is-hidden", next);
      wrap.setAttribute("aria-hidden", next ? "true" : "false");
      const link = wrap.querySelector("a");
      if (link) link.tabIndex = next ? -1 : 0;
    };

    const frame = window.requestAnimationFrame(sync);
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", sync);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative h-svh min-h-[640px] overflow-hidden"
    >
      <div ref={frameRef} className="absolute inset-0 will-change-transform">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          autoPlay={playVideo}
          preload={playVideo ? "auto" : "none"}
          poster={HERO_POSTER}
          aria-hidden
        >
          {playVideo ? <source src={HERO_VIDEO} type="video/mp4" /> : null}
        </video>
      </div>

      <div className="absolute inset-0 bg-charcoal/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/30" />

      <div className="relative z-10 flex h-full flex-col px-5 pb-6 md:px-10 md:pb-8 lg:px-16">
        <div className="mt-auto">
          <p className="hero-rise hero-rise-1 mb-3 text-[11px] tracking-[0.42em] text-sand uppercase md:mb-4">
            {site.heroEyebrow}
          </p>
          <h1 className="hero-rise hero-rise-2 -ml-[0.08em] max-w-none text-[15.5vw] leading-[0.82] font-medium tracking-[-0.045em] text-mist uppercase sm:text-[12.5vw] lg:text-[9.25rem] xl:text-[10.5rem]">
            {site.name}
          </h1>
          <div className="hero-rise hero-rise-3 mt-5 max-w-xl md:mt-6">
            <p className="hero-tagline">{site.tagline}</p>
          </div>
          <div className="hero-rise hero-rise-4 mt-6 md:mt-8">
            <a
              href={site.booking.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta group inline-flex self-start"
              onPointerDown={latchTapFill}
            >
              <span className="hero-cta-fill" aria-hidden />
              <span className="relative">{site.booking.cta}</span>
              <CtaArrow />
            </a>
          </div>
        </div>

        <div
          ref={cueWrapRef}
          className="hero-scroll-wrap mt-8 flex justify-center md:mt-10"
        >
          <a
            href="#about"
            className="hero-scroll flex flex-col items-center gap-2 text-mist/55 transition-colors duration-300 hover:text-sand"
            aria-label="Гортай далі"
          >
            <span className="text-[10px] tracking-[0.36em] uppercase">
              Далі
            </span>
            <span className="hero-scroll-arrow" aria-hidden>
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
