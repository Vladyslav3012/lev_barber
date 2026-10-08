import { afterEach, describe, expect, it } from "vitest";
import {
  BodyTooLargeError,
  CAREER_MAX_BODY_BYTES,
  clientIp,
  isAllowedOrigin,
  parseExtraOrigins,
  readCareerJsonBody,
  type CareerOriginContext,
} from "./career-request";

const prodSite: CareerOriginContext = {
  isProd: true,
  siteOrigin: "https://levbarber.ua",
  extraOrigins: [],
  publicOrigin: null,
};

afterEach(() => {
  delete process.env.TRUST_PROXY;
  delete process.env.VERCEL;
});

describe("isAllowedOrigin", () => {
  it("allows matching Origin in production", () => {
    const headers = new Headers({ Origin: "https://levbarber.ua" });
    expect(isAllowedOrigin(headers, prodSite)).toBe(true);
  });

  it("rejects wrong Origin in production", () => {
    const headers = new Headers({ Origin: "https://evil.example" });
    expect(isAllowedOrigin(headers, prodSite)).toBe(false);
  });

  it("rejects missing Origin/Referer in production", () => {
    expect(isAllowedOrigin(new Headers(), prodSite)).toBe(false);
  });

  it("allows matching Referer when Origin is absent", () => {
    const headers = new Headers({
      Referer: "https://levbarber.ua/career",
    });
    expect(isAllowedOrigin(headers, prodSite)).toBe(true);
  });

  it("allows CAREER_ALLOWED_ORIGINS extras", () => {
    const ctx: CareerOriginContext = {
      ...prodSite,
      extraOrigins: ["https://staging.example.com"],
    };
    const headers = new Headers({ Origin: "https://staging.example.com" });
    expect(isAllowedOrigin(headers, ctx)).toBe(true);
  });

  it("does not expand allowlist from Host in production", () => {
    const headers = new Headers({
      Host: "evil.example",
      Origin: "https://evil.example",
    });
    expect(isAllowedOrigin(headers, prodSite)).toBe(false);
  });
});

describe("parseExtraOrigins", () => {
  it("parses comma-separated absolute URLs", () => {
    expect(
      parseExtraOrigins("https://a.example, https://b.example/path"),
    ).toEqual(["https://a.example", "https://b.example"]);
  });

  it("skips invalid entries", () => {
    expect(parseExtraOrigins("not-a-url, https://ok.example")).toEqual([
      "https://ok.example",
    ]);
  });
});

describe("clientIp", () => {
  it("ignores forwarded headers without TRUST_PROXY", () => {
    const headers = new Headers({
      "x-real-ip": "1.2.3.4",
      "x-forwarded-for": "5.6.7.8",
    });
    expect(clientIp(headers, {})).toBe("unknown");
  });

  it("trusts X-Real-IP when TRUST_PROXY=1", () => {
    const headers = new Headers({ "x-real-ip": "1.2.3.4" });
    expect(clientIp(headers, { TRUST_PROXY: "1" })).toBe("1.2.3.4");
  });

  it("rejects multi-value X-Forwarded-For", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.1.1.1, 2.2.2.2",
    });
    expect(clientIp(headers, { TRUST_PROXY: "1" })).toBe("unknown");
  });

  it("trusts x-vercel-forwarded-for only on Vercel", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "9.9.9.9, 8.8.8.8",
    });
    expect(clientIp(headers, {})).toBe("unknown");
    expect(clientIp(headers, { VERCEL: "1" })).toBe("9.9.9.9");
  });
});

describe("readCareerJsonBody", () => {
  it("parses a small JSON object", async () => {
    const body = JSON.stringify({ name: "Олег", website: "" });
    const request = new Request("http://localhost/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    await expect(readCareerJsonBody(request)).resolves.toEqual({
      name: "Олег",
      website: "",
    });
  });

  it("rejects null / array / non-object JSON", async () => {
    for (const raw of ["null", "[]", '"x"', "1"]) {
      const request = new Request("http://localhost/api/career", {
        method: "POST",
        body: raw,
      });
      await expect(readCareerJsonBody(request)).rejects.toThrow(SyntaxError);
    }
  });

  it("rejects oversized Content-Length", async () => {
    const request = new Request("http://localhost/api/career", {
      method: "POST",
      headers: { "Content-Length": String(CAREER_MAX_BODY_BYTES + 1) },
      body: "{}",
    });
    await expect(readCareerJsonBody(request)).rejects.toBeInstanceOf(
      BodyTooLargeError,
    );
  });

  it("rejects streamed bodies over the byte cap", async () => {
    const oversized = "x".repeat(CAREER_MAX_BODY_BYTES + 64);
    const request = new Request("http://localhost/api/career", {
      method: "POST",
      body: oversized,
    });
    await expect(readCareerJsonBody(request)).rejects.toBeInstanceOf(
      BodyTooLargeError,
    );
  });
});
