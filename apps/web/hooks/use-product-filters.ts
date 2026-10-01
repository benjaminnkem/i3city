"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  PRODUCT_SORTS,
  PRODUCT_STATUS_FILTERS,
  STOCK_FILTERS,
  type ProductSort,
} from "@repo/types";
import {
  DEFAULT_PRODUCT_FILTERS,
  type ProductFilters,
} from "@/lib/admin/products";

function oneOf<T extends string>(
  value: string | null,
  options: readonly T[],
  fallback: T,
): T {
  return options.find((option) => option === value) ?? fallback;
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function useProductFilters(): [
  ProductFilters,
  (patch: Partial<ProductFilters>) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo<ProductFilters>(
    () => ({
      search: params.get("search") ?? "",
      categoryId: params.get("category") ?? "",
      status: oneOf(params.get("status"), PRODUCT_STATUS_FILTERS, "" as never),
      stock: oneOf(params.get("stock"), STOCK_FILTERS, "" as never),
      sort: oneOf<ProductSort>(
        params.get("sort"),
        PRODUCT_SORTS,
        DEFAULT_PRODUCT_FILTERS.sort,
      ),
      page: positiveInt(params.get("page"), 1),
      limit: DEFAULT_PRODUCT_FILTERS.limit,
    }),
    [params],
  );

  const update = useCallback(
    (patch: Partial<ProductFilters>) => {
      const next = { ...filters, ...patch };
      if (!("page" in patch)) {
        next.page = 1;
      }
      const query = new URLSearchParams();
      if (next.search) query.set("search", next.search);
      if (next.categoryId) query.set("category", next.categoryId);
      if (next.status) query.set("status", next.status);
      if (next.stock) query.set("stock", next.stock);
      if (next.sort !== DEFAULT_PRODUCT_FILTERS.sort)
        query.set("sort", next.sort);
      if (next.page > 1) query.set("page", String(next.page));
      const suffix = query.toString();
      router.replace(suffix ? `${pathname}?${suffix}` : pathname, {
        scroll: false,
      });
    },
    [filters, pathname, router],
  );

  return [filters, update];
}
