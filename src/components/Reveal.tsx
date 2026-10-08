"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

export function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No enhance → content stays visible (SSR, no-JS, reduced motion).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    el.dataset.enhance = "";

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      // Expand root downward so reveal starts before the block fills the screen.
      isMobile
        ? { threshold: 0, rootMargin: "0px 0px 22% 0px" }
        : { threshold: 0.06, rootMargin: "0px 0px 8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
