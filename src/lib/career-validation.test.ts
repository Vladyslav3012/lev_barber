import { describe, expect, it } from "vitest";
import { careerFieldsSchema } from "./career-fields-schema";
import {
  contactError,
  escapeTelegramHtml,
  formatCareerTelegramHtml,
  nameError,
  normalizeContact,
} from "./career-validation";

describe("nameError", () => {
  it("accepts latin and cyrillic names", () => {
    expect(nameError("Ok")).toBeNull();
    expect(nameError("Іван")).toBeNull();
    expect(nameError("Анна-Марія")).toBeNull();
    expect(nameError("O'Connor")).toBeNull();
  });

  it("rejects digits-only and punctuation-only", () => {
    expect(nameError("12")).toBeTruthy();
    expect(nameError("..")).toBeTruthy();
    expect(nameError("A")).toBeTruthy();
  });
});

describe("normalizeContact / contactError", () => {
  it("normalizes UA phone formats to +380…", () => {
    expect(normalizeContact("0680000000")).toBe("+380680000000");
    expect(normalizeContact("680000000")).toBe("+380680000000");
    expect(normalizeContact("+380680000000")).toBe("+380680000000");
  });

  it("accepts Instagram handles and URLs", () => {
    expect(contactError("@barber_lev")).toBeNull();
    expect(contactError("https://instagram.com/barber_lev")).toBeNull();
  });

  it("rejects incomplete phones", () => {
    expect(contactError("068")).toBeTruthy();
  });
});

describe("careerFieldsSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = careerFieldsSchema.safeParse({
      name: "Олег",
      contact: "0680000000",
      message: "Працюю барбером три роки, вмію фейди.",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.contact).toBe("+380680000000");
    }
  });

  it("rejects empty / short fields", () => {
    const parsed = careerFieldsSchema.safeParse({
      name: "12",
      contact: "",
      message: "коротко",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("Telegram HTML", () => {
  it("escapes HTML and flattens name/contact newlines", () => {
    const text = formatCareerTelegramHtml({
      name: "A<script>\nB",
      contact: "@x&y",
      message: "line1\nline2",
    });
    expect(text).toContain("A&lt;script&gt; B");
    expect(text).toContain("@x&amp;y");
    expect(text).toContain("line1\nline2");
    expect(escapeTelegramHtml("<b>")).toBe("&lt;b&gt;");
  });
});
