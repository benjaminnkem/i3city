import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export const ORDER_CODE_PATTERN = /^I3-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

export function generateOrderCode(
  pick: (max: number) => number = randomInt,
): string {
  const suffix = Array.from({ length: CODE_LENGTH }, () =>
    ALPHABET.charAt(pick(ALPHABET.length)),
  ).join("");
  return `I3-${suffix}`;
}
