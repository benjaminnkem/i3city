import type { Metadata } from "next";
import { ShopView } from "@/components/store/shop-view";
import { fetchProducts } from "@/lib/store/api";
import { parseShopParams } from "@/lib/store/shop-params";
import { SHOP_PAGE_SIZE } from "@repo/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>): Promise<Metadata> {
  const { search } = parseShopParams(await searchParams);
  return {
    title: search ? `Results for "${search}"` : "Shop all products",
    description:
      "Phones, chargers, earbuds, smartwatches and accessories, delivered across Nigeria.",
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
