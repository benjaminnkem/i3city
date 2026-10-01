import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackSignature(
  secret: string,
  rawBody: Buffer | undefined,
  signature: string | undefined,
): boolean {
  if (!rawBody || !signature) {
    return false;
  }
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

const REFERENCE_PATTERN =
  /^(I3-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6})(?:-(\d+))?$/;

export function codeFromReference(reference: string): string | null {
  return REFERENCE_PATTERN.exec(reference)?.[1] ?? null;
}

export function nextReference(code: string, current: string | null): string {
  if (!current) {
    return code;
  }
  const attempt = Number(REFERENCE_PATTERN.exec(current)?.[2] ?? 1);
  return `${code}-${attempt + 1}`;
}

export function toKobo(naira: number): number {
  return naira * 100;
}
