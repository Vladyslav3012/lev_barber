import { z } from "zod";
import {
  contactError,
  messageError,
  nameError,
  normalizeContact,
} from "./career-validation";

const trimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.string(),
);

/**
 * Server-side career payload. Keeps the same Ukrainian field errors as the form.
 * Honeypot (`website`) is checked separately before this schema runs.
 */
export const careerFieldsSchema = z.object({
  name: trimmedString.superRefine((value, ctx) => {
    const error = nameError(value);
    if (error) ctx.addIssue({ code: "custom", message: error });
  }),
  contact: trimmedString
    .transform((value) => normalizeContact(value))
    .superRefine((value, ctx) => {
      const error = contactError(value);
      if (error) ctx.addIssue({ code: "custom", message: error });
    }),
  message: trimmedString.superRefine((value, ctx) => {
    const error = messageError(value);
    if (error) ctx.addIssue({ code: "custom", message: error });
  }),
});

export type CareerFields = z.infer<typeof careerFieldsSchema>;
