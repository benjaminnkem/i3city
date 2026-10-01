import {
  NIGERIA_STATES,
  normaliseNigerianPhone,
  type AdminSettings,
  type ShippingRateInfo,
} from "@repo/types";
import { z } from "zod";
import { adminRequest } from "./client";

export const settingsKeys = {
  settings: ["admin", "settings"] as const,
  rates: ["admin", "shipping-rates"] as const,
};

export function getSettings(): Promise<AdminSettings> {
  return adminRequest<AdminSettings>({ url: "/admin/settings" });
}

export function saveSettings(
  settings: Omit<AdminSettings, "paystackEnabled">,
): Promise<AdminSettings> {
  return adminRequest<AdminSettings>({
    method: "put",
    url: "/admin/settings",
    data: settings,
  });
}

export function getRates(): Promise<ShippingRateInfo[]> {
  return adminRequest<ShippingRateInfo[]>({ url: "/admin/shipping-rates" });
}

export function saveRates(
  rates: ShippingRateInfo[],
): Promise<ShippingRateInfo[]> {
  return adminRequest<ShippingRateInfo[]>({
    method: "put",
    url: "/admin/shipping-rates",
    data: { rates },
  });
}

export const storeFormSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(1, "Enter the store name")
    .max(80, "Keep it under 80 characters"),
  whatsappNumber: z
    .string()
    .trim()
    .refine(
      (value) => normaliseNigerianPhone(value) !== null,
      "Enter a valid Nigerian WhatsApp number",
    ),
  supportEmail: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter a valid email address",
    ),
  address: z.string().trim().max(300, "Keep it under 300 characters"),
  openingHours: z.string().trim().max(200, "Keep it under 200 characters"),
  bankDetails: z.string().trim().max(600, "Keep it under 600 characters"),
});

export const deliveryFormSchema = z.object({
  defaultShippingFee: z
    .string()
    .trim()
    .regex(/^\d+$/, "Use whole numbers only")
    .transform(Number),
  freeShippingOver: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Use whole numbers only",
    ),
});

export const rateRowSchema = z.object({
  state: z.enum(NIGERIA_STATES),
  fee: z.string().trim().regex(/^\d+$/, "Whole numbers only").transform(Number),
  etaDays: z.string().trim().max(40, "Too long"),
});
