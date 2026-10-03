import { formatNaira } from "@repo/types";

export interface PricePreset {
  label: string;
  minPrice?: number;
  maxPrice?: number;
}

export const PRICE_PRESETS: PricePreset[] = [
  { label: `Under ${formatNaira(10_000)}`, maxPrice: 10_000 },
  {
    label: `${formatNaira(10_000)} to ${formatNaira(25_000)}`,
    minPrice: 10_000,
    maxPrice: 25_000,
  },
  { label: `Over ${formatNaira(25_000)}`, minPrice: 25_000 },
];

export function priceLabel(
  minPrice?: number,
  maxPrice?: number,
): string | null {
  if (minPrice !== undefined && maxPrice !== undefined) {
    return `${formatNaira(minPrice)} to ${formatNaira(maxPrice)}`;
  }
  if (minPrice !== undefined) return `Over ${formatNaira(minPrice)}`;
  if (maxPrice !== undefined) return `Under ${formatNaira(maxPrice)}`;
  return null;
}
