import type {
  PaginationMeta,
  PublicCategory,
  PublicOrder,
  PublicProduct,
  PublicProductDetail,
  PublicSettings,
  ShopSort,
} from "@repo/types";
import { cache } from "react";
import { ApiError, request, requestPage } from "@/lib/api";

export interface ShopParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: ShopSort;
  page?: number;
  limit?: number;
}

export const fetchSettings = cache(() =>
  request<PublicSettings>({ url: "/settings/public" }),
);

export const fetchCategories = cache(() =>
  request<PublicCategory[]>({ url: "/categories" }),
);

export function fetchProducts(
  params: ShopParams,
): Promise<{ items: PublicProduct[]; meta: PaginationMeta }> {
  return requestPage<PublicProduct>({ url: "/products", params });
}

async function nullOnNotFound<T>(call: () => Promise<T>): Promise<T | null> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export const fetchProduct = cache((slug: string) =>
  nullOnNotFound(() =>
    request<PublicProductDetail>({
      url: `/products/${encodeURIComponent(slug)}`,
    }),
  ),
);

export const fetchOrder = cache((code: string) =>
  nullOnNotFound(() =>
    request<PublicOrder>({ url: `/orders/${encodeURIComponent(code)}` }),
  ),
);
