import {
  HERO_CTA_HREF_PATTERN,
  HERO_LIMITS,
  type AdminHeroSlide,
  type HeroSlideInput,
  type HeroSlideStatus,
} from "@repo/types";
import { z } from "zod";
import { adminRequest, adminRequestVoid } from "./client";

export const heroKeys = {
  all: ["admin", "hero"] as const,
  detail: (id: string) => ["admin", "hero", "detail", id] as const,
};

export function listHeroSlides(): Promise<AdminHeroSlide[]> {
  return adminRequest<AdminHeroSlide[]>({ url: "/admin/hero" });
}

export function getHeroSlide(id: string): Promise<AdminHeroSlide> {
  return adminRequest<AdminHeroSlide>({ url: `/admin/hero/${id}` });
}

export function createHeroSlide(
  input: HeroSlideInput,
): Promise<AdminHeroSlide> {
  return adminRequest<AdminHeroSlide>({
    method: "post",
    url: "/admin/hero",
    data: input,
  });
}

export function updateHeroSlide(
  id: string,
  input: HeroSlideInput,
): Promise<AdminHeroSlide> {
  return adminRequest<AdminHeroSlide>({
    method: "put",
    url: `/admin/hero/${id}`,
    data: input,
  });
}

export function reorderHeroSlides(ids: string[]): Promise<AdminHeroSlide[]> {
  return adminRequest<AdminHeroSlide[]>({
    method: "put",
    url: "/admin/hero/order",
    data: { ids },
  });
}

export function deleteHeroSlide(id: string): Promise<void> {
  return adminRequestVoid({ method: "delete", url: `/admin/hero/${id}` });
}

export const HERO_STATUS_LABEL: Record<HeroSlideStatus, string> = {
  LIVE: "Live",
  SCHEDULED: "Scheduled",
  ENDED: "Ended",
  OFF: "Off",
};

const limit = (max: number) => `Keep it under ${max} characters`;

export const heroFormSchema = z
  .object({
    kind: z.enum(["PRODUCTS", "IMAGE"]),
    headline: z
      .string()
      .trim()
      .min(1, "Write a headline")
      .max(HERO_LIMITS.headline, limit(HERO_LIMITS.headline)),
    subtext: z
      .string()
      .trim()
      .max(HERO_LIMITS.subtext, limit(HERO_LIMITS.subtext)),
    ctaLabel: z
      .string()
      .trim()
      .min(1, "Write the button text")
      .max(HERO_LIMITS.ctaLabel, limit(HERO_LIMITS.ctaLabel)),
    ctaHref: z
      .string()
      .trim()
      .max(HERO_LIMITS.ctaHref, limit(HERO_LIMITS.ctaHref))
      .regex(
        HERO_CTA_HREF_PATTERN,
        "Use a link on this site that starts with /, like /shop",
      ),
    image: z.string().nullable(),
    imageAlt: z
      .string()
      .trim()
      .max(HERO_LIMITS.imageAlt, limit(HERO_LIMITS.imageAlt)),
    productIds: z.array(z.string()).max(HERO_LIMITS.products),
    startDate: z.string(),
    endDate: z.string(),
  })
  .superRefine((value, context) => {
    if (value.kind === "IMAGE" && !value.image) {
      context.addIssue({
        code: "custom",
        path: ["image"],
        message: "Upload a banner image",
      });
    }
    if (value.kind === "PRODUCTS" && value.productIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["productIds"],
        message: "Pick at least one product",
      });
    }
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "The end date must be on or after the start date",
      });
    }
  });
