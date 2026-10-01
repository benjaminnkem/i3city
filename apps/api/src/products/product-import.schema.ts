import { z } from "zod";

const MAX_PRICE = 100_000_000;
const MAX_STOCK = 100_000;
const TRUE_VALUES = ["true", "yes", "y", "1"];
const FALSE_VALUES = ["false", "no", "n", "0"];

function cleanNumber(value: string): string {
  return value.replace(/[₦,\s]/g, "");
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .transform((value) => (value === "" ? undefined : value))
    .optional();

const wholeNumber = (label: string, minimum: number, maximum: number) =>
  z
    .string()
    .transform(cleanNumber)
    .refine((value) => /^\d+$/.test(value), `${label} must be a whole number`)
    .transform(Number)
    .refine(
      (value) => value >= minimum && value <= maximum,
      `${label} must be between ${minimum} and ${maximum}`,
    );

const optionalWholeNumber = (label: string, minimum: number, maximum: number) =>
  z
    .string()
    .transform(cleanNumber)
    .transform((value) => (value === "" ? undefined : value))
    .optional()
    .pipe(wholeNumber(label, minimum, maximum).optional());

const flag = (label: string) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .transform((value, context) => {
      if (value === "") return undefined;
      if (TRUE_VALUES.includes(value)) return true;
      if (FALSE_VALUES.includes(value)) return false;
      context.addIssue({
        code: "custom",
        message: `${label} must be true or false`,
      });
      return z.NEVER;
    })
    .optional();

export const importRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(160, "Name is too long"),
  sku: optionalText(60),
  brand: optionalText(80),
  category: optionalText(80),
  price: wholeNumber("Price", 1, MAX_PRICE),
  compare_at_price: optionalWholeNumber("Compare-at price", 1, MAX_PRICE),
  stock: optionalWholeNumber("Stock", 0, MAX_STOCK),
  active: flag("Active"),
  featured: flag("Featured"),
  description: z
    .string()
    .max(5000, "Description is too long")
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});

export type ParsedImportRow = z.infer<typeof importRowSchema>;
