import { NIGERIA_STATES, normaliseNigerianPhone } from "@repo/types";
import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Keep the name under 100 characters"),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => normaliseNigerianPhone(value) !== null,
      "Enter a valid Nigerian phone number",
    ),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter a valid email address",
    ),
  address: z
    .string()
    .trim()
    .min(5, "Enter your delivery address")
    .max(300, "Keep the address under 300 characters"),
  city: z
    .string()
    .trim()
    .min(2, "Enter your city")
    .max(80, "Keep the city under 80 characters"),
  state: z.enum(NIGERIA_STATES, "Choose your state"),
  note: z.string().trim().max(500, "Keep the note under 500 characters"),
});

export type CheckoutValues = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  note: string;
};
