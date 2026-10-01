import type { ProductSort } from "@repo/types";
import type { SortingState } from "@tanstack/react-table";

export function toSorting(sort: ProductSort): SortingState {
  switch (sort) {
    case "name":
      return [{ id: "name", desc: false }];
    case "price-asc":
      return [{ id: "price", desc: false }];
    case "price-desc":
      return [{ id: "price", desc: true }];
    case "stock-asc":
      return [{ id: "stock", desc: false }];
    default:
      return [];
  }
}

export function fromSorting(state: SortingState): ProductSort {
  const first = state[0];
  if (!first) return "newest";
  if (first.id === "name") return "name";
  if (first.id === "price") return first.desc ? "price-desc" : "price-asc";
  if (first.id === "stock") return "stock-asc";
  return "newest";
}
