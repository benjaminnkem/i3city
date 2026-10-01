import { SHOP_PAGE_SIZE } from "@repo/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/store/shop-view";
import { fetchCategories, fetchProducts } from "@/lib/store/api";
import { parseShopParams } from "@/lib/store/shop-params";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await fetchCategories()).find(
    (entry) => entry.slug === slug,
  );
  return category
    ? {
        title: category.name,
        description: `Shop ${category.name.toLowerCase()} with delivery across Nigeria.`,
      }
    : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = (await fetchCategories()).find(
    (entry) => entry.slug === slug,
  );
  if (!category) notFound();
  const query = parseShopParams(await searchParams);
  const { items, meta } = await fetchProducts({
    ...query,
    category: slug,
    limit: SHOP_PAGE_SIZE,
  });
  return (
    <ShopView
      title={category.name}
      basePath={`/category/${slug}`}
      params={query}
      products={items}
      meta={meta}
    />
  );
}
