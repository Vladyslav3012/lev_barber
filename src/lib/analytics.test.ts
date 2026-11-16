import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "@/data/site";
import { GA_MEASUREMENT_ID, trackBookingClick } from "./analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("booking click analytics", () => {
  it.each(["hero", "floating"] as const)(
    "sends one intent event for the %s button to the correct GA4 stream",
    (location) => {
      const gtag = vi.fn();
      vi.stubGlobal("window", { gtag });

      trackBookingClick(location);

      expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "booking_click", {
        send_to: GA_MEASUREMENT_ID,
        button_location: location,
        link_url: site.booking.href,
      });
    },
  );

  it("does not break booking when Google Analytics is unavailable", () => {
    vi.stubGlobal("window", {});
    expect(() => trackBookingClick("hero")).not.toThrow();
  });

  it("does not break booking when the analytics handler throws", () => {
    vi.stubGlobal("window", {
      gtag: () => {
        throw new Error("Analytics unavailable");
      },
    });
    expect(() => trackBookingClick("floating")).not.toThrow();
  });

  it("is safe during server rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(() => trackBookingClick("hero")).not.toThrow();
  });
});
