import { HERO_WHATSAPP_HREF } from "@repo/types";

export function heroHref(ctaHref: string, whatsappHref: string): string {
  return ctaHref === HERO_WHATSAPP_HREF ? whatsappHref : ctaHref;
}

export const HERO_TONE_CLASS = {
  1: "bg-tone-1",
  2: "bg-tone-2",
  3: "bg-tone-3",
  4: "bg-tone-4",
} as const;
