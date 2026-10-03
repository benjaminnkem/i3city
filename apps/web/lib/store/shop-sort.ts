import { SHOP_SORTS, type ShopSort } from "@repo/types";

export const SORT_LABELS: Record<ShopSort, string> = {
  newest: "Newest",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
};

export const SORT_ITEMS = SHOP_SORTS.map((value) => ({
  value,
  label: SORT_LABELS[value],
}));
