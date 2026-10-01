export const PLACEHOLDER_WHATSAPP_NUMBERS: readonly string[] = [
  "2340000000000",
  "2348000000000",
  "2348000000001",
];

export function isPlaceholderWhatsApp(number: string): boolean {
  return PLACEHOLDER_WHATSAPP_NUMBERS.includes(number);
}
