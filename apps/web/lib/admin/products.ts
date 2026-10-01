import type {
  AdminProduct,
  PaginationMeta,
  ProductSort,
  ProductStatusFilter,
  StockFilter,
} from "@repo/types";
import { z } from "zod";
import { adminRequest, adminRequestPage, adminRequestVoid } from "./client";

export interface ProductFilters {
  search: string;
  categoryId: string;
  status: ProductStatusFilter | "";
  stock: StockFilter | "";
  sort: ProductSort;
  page: number;
  limit: number;
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: "",
  categoryId: "",
  status: "",
  stock: "",
  sort: "newest",
  page: 1,
  limit: 20,
};

export const productKeys = {
  all: ["admin", "products"] as const,
  list: (filters: ProductFilters) =>
    ["admin", "products", "list", filters] as const,
  detail: (id: string) => ["admin", "products", "detail", id] as const,
};

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  brand: string | null;
  images: string[];
  featured: boolean;
  active: boolean;
  categoryId: string | null;
}

export type ProductPatch = Partial<ProductInput>;

export function listProducts(
  filters: ProductFilters,
): Promise<{ items: AdminProduct[]; meta: PaginationMeta }> {
  const { search, categoryId, status, stock, sort, page, limit } = filters;
  return adminRequestPage<AdminProduct>({
    url: "/admin/products",
    params: {
      page,
      limit,
      sort,
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
      ...(stock ? { stock } : {}),
    },
  });
}

export function getProduct(id: string): Promise<AdminProduct> {
  return adminRequest<AdminProduct>({ url: `/admin/products/${id}` });
}

export function createProduct(input: ProductInput): Promise<AdminProduct> {
  return adminRequest<AdminProduct>({
    method: "post",
    url: "/admin/products",
    data: input,
  });
}

export function updateProduct(
  id: string,
  patch: ProductPatch,
): Promise<AdminProduct> {
  return adminRequest<AdminProduct>({
    method: "patch",
    url: `/admin/products/${id}`,
    data: patch,
  });
}

export function deleteProduct(id: string): Promise<void> {
  return adminRequestVoid({ method: "delete", url: `/admin/products/${id}` });
}

export function deleteProducts(ids: string[]): Promise<{ deleted: number }> {
  return adminRequest<{ deleted: number }>({
    method: "post",
    url: "/admin/products/delete",
    data: { ids },
  });
}

export function setProductsActive(
  ids: string[],
  active: boolean,
): Promise<{ updated: number }> {
  return adminRequest<{ updated: number }>({
    method: "post",
    url: "/admin/products/status",
    data: { ids, active },
  });
}

const wholeNumber = (label: string, minimum: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}`)
    .regex(/^\d+$/, "Use whole numbers only")
    .transform(Number)
    .refine((value) => value >= minimum, {
      message: minimum === 0 ? "Cannot be negative" : "Must be at least 1",
    });

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a product name")
      .max(160, "Keep the name under 160 characters"),
    description: z
      .string()
      .max(5000, "Keep the description under 5,000 characters"),
    brand: z.string().trim().max(80, "Keep the brand under 80 characters"),
    sku: z.string().trim().max(60, "Keep the SKU under 60 characters"),
    price: wholeNumber("a price", 1),
    compareAtPrice: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\d+$/.test(value),
        "Use whole numbers only",
      ),
    stock: wholeNumber("the stock", 0),
    categoryId: z.string(),
    active: z.boolean(),
    featured: z.boolean(),
  })
  .superRefine((value, context) => {
    if (
      value.compareAtPrice !== "" &&
      Number(value.compareAtPrice) <= value.price
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "Must be higher than the price",
      });
    }
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
