import { SHOP_PAGE_SIZE } from "@repo/types";
import type { Metadata } from "next";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ShopView } from "@/components/store/shop-view";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { filteredRobots, listingCanonical } from "@/lib/seo/meta";
import { fetchProducts } from "@/lib/store/api";
import { parseShopParams } from "@/lib/store/shop-params";

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
    alternates: { canonical: listingCanonical("/shop", params) },
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
  const title = params.search ? `Results for "${params.search}"` : "All products";
  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
          ]),
          itemListJsonLd(title, items),
        ]}
      />
      <ShopView
        title={title}
        description={
          params.search
            ? undefined
            : `Prices in naira, with delivery to every state in Nigeria. ${meta.total} ${meta.total === 1 ? "product" : "products"}.`
        }
        basePath="/shop"
        params={params}
        products={items}
        meta={meta}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Shop" },
        ]}
      />
    </>
  );
}
