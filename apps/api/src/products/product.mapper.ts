import type { AdminProduct } from "@repo/types";
import type { Prisma } from "../generated/prisma/client.js";
import type { StorageService } from "../storage/storage.service.js";

export const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

export type ProductRow = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

export function toAdminProduct(
  row: ProductRow,
  storage: StorageService,
): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    stock: row.stock,
    sku: row.sku,
    brand: row.brand,
    images: row.images,
    imageUrls: row.images.map((key) => storage.publicUrl(key)),
    featured: row.featured,
    active: row.active,
    categoryId: row.categoryId,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
