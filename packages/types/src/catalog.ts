export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  brand: string | null;
  images: string[];
  imageUrls: string[];
  featured: boolean;
  active: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedImage {
  key: string;
  publicUrl: string;
}

export const PRODUCT_SORTS = [
  "newest",
  "name",
  "price-asc",
  "price-desc",
  "stock-asc",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const STOCK_FILTERS = ["in", "low", "out"] as const;

export type StockFilter = (typeof STOCK_FILTERS)[number];

export const PRODUCT_STATUS_FILTERS = ["active", "inactive"] as const;

export type ProductStatusFilter = (typeof PRODUCT_STATUS_FILTERS)[number];

export const LOW_STOCK_THRESHOLD = 5;
export const MAX_PRODUCT_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_EDGE_PX = 1600;
export const IMAGE_CONTENT_TYPE = "image/webp";
export const IMAGE_KEY_PATTERN = /^products\/[0-9a-f-]{36}\.webp$/;
