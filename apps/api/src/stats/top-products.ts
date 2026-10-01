import type { TopProduct } from "@repo/types";

interface SoldItem {
  name: string;
  price: number;
  quantity: number;
}

export function topProducts(items: SoldItem[], limit: number): TopProduct[] {
  const totals = new Map<string, TopProduct>();
  for (const item of items) {
    const entry = totals.get(item.name) ?? {
      name: item.name,
      units: 0,
      revenue: 0,
    };
    entry.units += item.quantity;
    entry.revenue += item.price * item.quantity;
    totals.set(item.name, entry);
  }
  return [...totals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}
