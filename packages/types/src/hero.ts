import type { PublicProduct } from "./store.js";

export const HERO_SLIDE_KINDS = ["PRODUCTS", "IMAGE"] as const;
export type HeroSlideKind = (typeof HERO_SLIDE_KINDS)[number];

export const HERO_TONES = [1, 2, 3, 4] as const;
export type HeroTone = (typeof HERO_TONES)[number];

export const HERO_SLIDE_STATUSES = [
  "LIVE",
  "SCHEDULED",
  "ENDED",
  "OFF",
] as const;
export type HeroSlideStatus = (typeof HERO_SLIDE_STATUSES)[number];

export const HERO_LIMITS = {
  slides: 8,
  products: 3,
  headline: 80,
  subtext: 160,
  ctaLabel: 30,
  ctaHref: 200,
  imageAlt: 140,
} as const;

export const HERO_WHATSAPP_HREF = "whatsapp";
export const HERO_CTA_HREF_PATTERN =
  /^(?:whatsapp|\/(?!\/)[A-Za-z0-9\-._~/?=&%+]*)$/;
export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface HeroSlideInput {
  kind: HeroSlideKind;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  image: string | null;
  imageAlt: string;
  productIds: string[];
  tone: HeroTone | null;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface HeroTileProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
}

export interface HeroSlideProduct extends HeroTileProduct {
  active: boolean;
}

export interface AdminHeroSlide extends HeroSlideInput {
  id: string;
  imageUrl: string | null;
  products: HeroSlideProduct[];
  status: HeroSlideStatus;
  sortOrder: number;
}

export interface PublicHeroSlide {
  id: string;
  kind: HeroSlideKind;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  imageAlt: string;
  tone: HeroTone | null;
  products: PublicProduct[];
}
