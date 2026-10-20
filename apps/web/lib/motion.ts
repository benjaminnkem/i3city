import type { Variants } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.25,
  base: 0.5,
} as const;

export const STAGGER = {
  tight: 0.06,
  loose: 0.1,
} as const;

export const REVEAL_VIEWPORT = {
  once: true,
  margin: "0px 0px -80px 0px",
} as const;

export type RevealVariant = "rise" | "scale" | "fade";

export const itemVariants: Record<RevealVariant, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.base, ease: EASE_OUT },
    },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: EASE_OUT },
    },
  },
  fade: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: DURATION.base, ease: EASE_OUT },
    },
  },
};

export const MARQUEE = {
  secondsPerCharacter: 0.18,
  minSeconds: 18,
} as const;

export function marqueeSeconds(messages: string[]): number {
  const characters = messages.reduce((sum, text) => sum + text.length, 0);
  return Math.max(
    MARQUEE.minSeconds,
    Math.round(characters * MARQUEE.secondsPerCharacter),
  );
}
