import { SHOP_PAGE_SIZE } from "@repo/types";
import type { MetadataRoute } from "next";
import { fetchCategories, fetchProducts } from "@/lib/store/api";
import { siteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;
const MAX_PAGES = 50;

function extraPages(total: number): number[] {
  const pages = Math.min(MAX_PAGES, Math.ceil(total / SHOP_PAGE_SIZE));
  return Array.from({ length: Math.max(0, pages - 1) }, (_, index) => index + 2);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
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
      for (const page of extraPages(category.productCount)) {
        entries.push({
          url: `${site}/category/${category.slug}?page=${page}`,
          changeFrequency: "daily",
          priority: 0.4,
        });
      }
    }
    let total = 0;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const { items, meta } = await fetchProducts({ page, limit: PAGE_SIZE });
      total = meta.total;
      for (const product of items) {
        entries.push({
          url: `${site}/product/${product.slug}`,
          lastModified: product.updatedAt || product.createdAt,
          ...(product.imageUrls.length > 0
            ? { images: product.imageUrls.slice(0, 1) }
            : {}),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
      if (page >= meta.totalPages) break;
    }
    for (const page of extraPages(total)) {
      entries.push({
        url: `${site}/shop?page=${page}`,
        changeFrequency: "daily",
        priority: 0.5,
      });
    }
  } catch {
    return entries;
  }
  return entries;
}
