"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  ORDER_SORTS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderSort,
} from "@repo/types";
import { DEFAULT_ORDER_FILTERS, type OrderFilters } from "@/lib/admin/orders";

function oneOf<T extends string>(
  value: string | null,
  options: readonly T[],
): T | "" {
  return options.find((option) => option === value) ?? "";
}

export function useOrderFilters(): [
  OrderFilters,
  (patch: Partial<OrderFilters>) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo<OrderFilters>(() => {
    const page = Number(params.get("page"));
    return {
      status: oneOf(params.get("status"), ORDER_STATUSES),
      paymentStatus: oneOf(params.get("payment"), PAYMENT_STATUSES),
      search: params.get("search") ?? "",
      sort: (oneOf<OrderSort>(params.get("sort"), ORDER_SORTS) ||
        DEFAULT_ORDER_FILTERS.sort) as OrderSort,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      limit: DEFAULT_ORDER_FILTERS.limit,
    };
  }, [params]);

  const update = useCallback(
    (patch: Partial<OrderFilters>) => {
      const next = { ...filters, ...patch };
      if (!("page" in patch)) next.page = 1;
      const query = new URLSearchParams();
      if (next.status) query.set("status", next.status);
      if (next.paymentStatus) query.set("payment", next.paymentStatus);
      if (next.search) query.set("search", next.search);
      if (next.sort !== DEFAULT_ORDER_FILTERS.sort)
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
