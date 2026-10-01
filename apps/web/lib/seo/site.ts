import { publicEnv } from "@/lib/env";

export const SITE_NAME = "i3City";
export const SITE_TAGLINE = "Phones, gadgets and accessories in Nigeria";
export const SITE_DESCRIPTION =
  "Shop phones, chargers, earbuds, smartwatches and accessories at i3City. Fast delivery to every state in Nigeria, order on WhatsApp or pay by card.";

export function siteUrl(): string {
  return publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function trimDescription(text: string, limit = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  return `${flat.slice(0, limit - 1).trimEnd()}…`;
}
