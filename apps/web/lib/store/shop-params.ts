import { SHOP_SORTS, type ShopSort } from "@repo/types";
import type { ShopParams } from "./api";

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function wholeNumber(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export function parseShopParams(raw: RawParams): ShopParams {
  const sort =
    SHOP_SORTS.find((option) => option === first(raw.sort)) ?? "newest";
  return {
    search: first(raw.search)?.trim() || undefined,
    minPrice: wholeNumber(first(raw.minPrice)),
    maxPrice: wholeNumber(first(raw.maxPrice)),
    inStock: first(raw.inStock) === "true" ? true : undefined,
    sort: sort as ShopSort,
    page: wholeNumber(first(raw.page)) ?? 1,
  };
}

export function shopQueryString(
  params: ShopParams,
  overrides: Partial<ShopParams> = {},
): string {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (merged.search) query.set("search", merged.search);
  if (merged.minPrice !== undefined)
    query.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice !== undefined)
    query.set("maxPrice", String(merged.maxPrice));
  if (merged.inStock) query.set("inStock", "true");
  if (merged.sort && merged.sort !== "newest") query.set("sort", merged.sort);
  if (merged.page && merged.page > 1) query.set("page", String(merged.page));
  const text = query.toString();
  return text ? `?${text}` : "";
}
