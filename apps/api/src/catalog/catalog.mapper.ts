import type { PublicProduct } from "@repo/types";
import type { Prisma } from "../generated/prisma/client.js";
import type { StorageService } from "../storage/storage.service.js";

export const PUBLIC_PRODUCT_INCLUDE = {
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

export type PublicProductRow = Prisma.ProductGetPayload<{
  include: typeof PUBLIC_PRODUCT_INCLUDE;
}>;

export function toPublicProduct(
  row: PublicProductRow,
  storage: StorageService,
): PublicProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    stock: row.stock,
    brand: row.brand,
    imageUrls: row.images.map((key) => storage.publicUrl(key)),
    featured: row.featured,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
