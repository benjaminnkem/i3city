import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { fetchCategories, fetchProducts } from "@/lib/store/api";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;
const MAX_PAGES = 20;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = publicEnv.NEXT_PUBLIC_SITE_URL;
  const entries: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/shop`, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${site}/delivery-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${site}/returns-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
  try {
    const categories = await fetchCategories();
    for (const category of categories) {
      entries.push({
        url: `${site}/category/${category.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const { items, meta } = await fetchProducts({ page, limit: PAGE_SIZE });
      for (const product of items) {
        entries.push({
          url: `${site}/product/${product.slug}`,
          lastModified: product.createdAt,
          ...(product.imageUrls.length > 0
            ? { images: product.imageUrls.slice(0, 1) }
            : {}),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
      if (page >= meta.totalPages) break;
    }
  } catch {
    return entries;
  }
  return entries;
}
