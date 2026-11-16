"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { CalendarIcon, InstagramIcon, TikTokIcon } from "./icons";

function focusableIn(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
  ).filter((el) => {
    if (el.tabIndex < 0 || el.closest("[hidden]") || el.getClientRects().length === 0) {
      return false;
    }
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

function supportsScrollTimeline() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline", "scroll()")
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const heroBooking = document.getElementById("hero-booking");
    const bar = barRef.current;
    if (!heroBooking || !bar) return;

    let observer: IntersectionObserver | undefined;
    const observeBooking = () => {
      observer?.disconnect();
      const headerHeight = bar.getBoundingClientRect().height;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          // Show only after the hero button passes behind the fixed header,
          // not when it is still below the viewport on a short screen.
          setShowBooking(
            entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? headerHeight),
          );
        },
        { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 },
      );
      observer.observe(heroBooking);
    };

    observeBooking();
    const resizeObserver = new ResizeObserver(observeBooking);
    resizeObserver.observe(bar);
    return () => {
      observer?.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  // Phone/ngrok: window.scrollY often stays 0 — CSS scroll-timeline paints the
  // surface (same trick as «Далі»). JS is only a fallback without that API.
  useEffect(() => {
    if (supportsScrollTimeline()) return;

    const updateScrolled = () => {
      const y = window.scrollY;
      setScrolled((was) => (was ? y > 8 : y > 40));
    };

    const frame = window.requestAnimationFrame(updateScrolled);
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrolled);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const header = headerRef.current;
    if (!window.matchMedia("(pointer: coarse)").matches) {
      mobileNavRef.current?.querySelector<HTMLElement>("a")?.focus();
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuBtnRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !header) return;

      const items = focusableIn(header);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;
  const floatingBookingVisible = showBooking && !open;

  return (
    <header
      ref={headerRef}
      data-nav
      data-open={open ? "true" : "false"}
      className="site-header fixed inset-x-0 top-0 z-[70]"
    >
      {/* Surface fades in on scroll via CSS timeline (mobile) or .is-solid (JS fallback / menu). */}
      <div
        aria-hidden
        className={`site-header-surface absolute inset-0 -z-10 ${solid ? "is-solid" : ""}`}
      />

      <div ref={barRef} className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-5 md:h-16 md:px-8">
        <a
          href="#top"
          className="text-[13px] font-medium tracking-[0.22em] text-mist uppercase"
          onClick={() => setOpen(false)}
        >
          {site.name}
        </a>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-8">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] tracking-[0.08em] text-mist/80 transition-colors duration-300 hover:text-sand"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 md:gap-2">
          <a
            href={site.tiktok.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-11 w-11 items-center justify-center text-mist/75 transition-colors duration-200 hover:text-sand sm:flex"
            aria-label={site.tiktok.label}
          >
            <TikTokIcon />
          </a>
          <a
            href={site.instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-11 w-11 items-center justify-center text-mist/75 transition-colors duration-200 hover:text-sand sm:flex"
            aria-label={site.instagram.label}
          >
            <InstagramIcon />
          </a>
          <button
            ref={menuBtnRef}
            type="button"
            className="flex h-11 w-11 items-center justify-center text-mist/80 transition-colors duration-200 hover:text-mist lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Закрити меню" : "Відкрити меню"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Меню</span>
            <span className="relative block h-2.5 w-4">
              <span
                className={`absolute left-0 block h-px w-full bg-current transition-transform duration-300 ${
                  open ? "top-1 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute top-1 left-0 block h-px w-full bg-current transition-opacity duration-300 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-full bg-current transition-transform duration-300 ${
                  open ? "top-1 -rotate-45" : "top-2"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`relative overflow-hidden border-t border-white/5 transition-[max-height,opacity] duration-300 lg:hidden ${
          open ? "max-h-[calc(100dvh-4rem)] overflow-y-auto opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <nav ref={mobileNavRef} className="flex flex-col gap-1 px-5 py-6">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              tabIndex={open ? undefined : -1}
              onClick={() => setOpen(false)}
              className="py-3 text-sm tracking-[0.12em] text-mist uppercase"
            >
              {item.label}
            </a>
          ))}
          <div className="mt-4 flex flex-wrap gap-x-6 border-t border-mist/20 pt-3 sm:hidden">
            <a
              href={site.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={site.instagram.label}
              tabIndex={open ? undefined : -1}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-mist/80 transition-colors hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand"
            >
              <InstagramIcon />
              Instagram
            </a>
            <a
              href={site.tiktok.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={site.tiktok.label}
              tabIndex={open ? undefined : -1}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-mist/80 transition-colors hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand"
            >
              <TikTokIcon />
              TikTok
            </a>
          </div>
        </nav>
      </div>
      <a
        href={site.booking.href}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-booking"
        data-floating-booking
        data-visible={floatingBookingVisible}
        aria-label={site.booking.cta}
        aria-hidden={!floatingBookingVisible}
        tabIndex={floatingBookingVisible ? undefined : -1}
      >
        <CalendarIcon />
        <span>Записатися</span>
      </a>
    </header>
  );
}
