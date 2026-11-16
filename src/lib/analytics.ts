import { site } from "@/data/site";

export const GA_MEASUREMENT_ID = "G-2JH9MEPHN6";

type BookingButtonLocation = "hero" | "floating";
type AnalyticsWindow = Window & {
  gtag?: (
    command: "event",
    name: "booking_click",
    parameters: {
      send_to: string;
      button_location: BookingButtonLocation;
      link_url: string;
    },
  ) => void;
};

/** Measures intent to open Alteg; a confirmed appointment is a separate event. */
export function trackBookingClick(location: BookingButtonLocation): void {
  if (typeof window === "undefined") return;

  try {
    (window as AnalyticsWindow).gtag?.("event", "booking_click", {
      send_to: GA_MEASUREMENT_ID,
      button_location: location,
      link_url: site.booking.href,
    });
  } catch {
    // Analytics must never prevent the booking link from opening.
  }
}
