import { publicEnv } from "@/lib/env";

export const SITE_NAME = "i3City";
export const SITE_TAGLINE = "Phones, Smartwatches & Gadgets Online in Nigeria";
export const SITE_DESCRIPTION =
  "Buy phones, earbuds, smartwatches, chargers and power banks from i3City in Lagos. Delivery to every state in Nigeria. Order on WhatsApp or pay by card.";
export const SITE_KEYWORDS = [
  "buy phones online in Nigeria",
  "gadgets store in Lagos",
  "smartwatch price in Nigeria",
  "wireless earbuds price in Nigeria",
  "power bank price in Nigeria",
  "phone chargers and cables",
  "phone cases and screen protectors",
  "gaming consoles and accessories",
  "Egbeda gadgets",
  "i3City",
];

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
