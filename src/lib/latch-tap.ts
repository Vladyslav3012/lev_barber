import type { PointerEvent } from "react";

/**
 * Touch :active ends on finger-up and reverses the fill mid-way — latch instead,
 * then clear after the click navigates / after a short hold.
 */
export function latchTapFill(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === "mouse") return;

  const el = event.currentTarget;
  el.classList.add("is-pressed");

  const clear = () => {
    el.classList.remove("is-pressed");
    el.removeEventListener("pointerup", clear);
    el.removeEventListener("pointercancel", clear);
    el.removeEventListener("lostpointercapture", clear);
  };

  el.addEventListener("pointerup", clear);
  el.addEventListener("pointercancel", clear);
  el.addEventListener("lostpointercapture", clear);
  window.setTimeout(clear, 800);
}
