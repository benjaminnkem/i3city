import type { Metadata } from "next";
import { ShopView } from "@/components/store/shop-view";
import { filteredRobots } from "@/lib/seo/meta";
import { fetchProducts } from "@/lib/store/api";
import { parseShopParams } from "@/lib/store/shop-params";
import { SHOP_PAGE_SIZE } from "@repo/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>): Promise<Metadata> {
  const params = parseShopParams(await searchParams);
  const page = params.page ?? 1;
  const base = params.search
    ? `Results for "${params.search}"`
    : "Shop Phones, Earbuds & Gadgets";
  return {
    title: page > 1 ? `${base}, Page ${page}` : base,
    description:
      "Browse phones, earbuds, smartwatches, chargers, power banks and accessories at i3City. Prices in naira and delivery to every state in Nigeria.",
    alternates: {
      canonical: page > 1 ? `/shop?page=${page}` : "/shop",
    },
    ...filteredRobots(params),
  };
}

export default async function ShopPage({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  const params = parseShopParams(await searchParams);
  const { items, meta } = await fetchProducts({
    ...params,
    limit: SHOP_PAGE_SIZE,
  });
  return (
    <ShopView
      title={params.search ? `Results for "${params.search}"` : "All products"}
      basePath="/shop"
      params={params}
      products={items}
      meta={meta}
    />
  );
}
