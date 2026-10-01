import { SHOP_PAGE_SIZE } from "@repo/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ShopView } from "@/components/store/shop-view";
import { fetchCategories, fetchProducts } from "@/lib/store/api";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { parseShopParams } from "@/lib/store/shop-params";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await fetchCategories()).find(
    (entry) => entry.slug === slug,
  );
  if (!category) return {};
  const page = parseShopParams(await searchParams).page ?? 1;
  const description = `Shop ${category.name.toLowerCase()} at i3City. ${category.productCount} products with delivery across Nigeria.`;
  return {
    title: category.name,
    description,
    alternates: {
      canonical:
        page > 1 ? `/category/${slug}?page=${page}` : `/category/${slug}`,
    },
    openGraph: { title: category.name, description, url: `/category/${slug}` },
  };
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
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: category.name, path: `/category/${slug}` },
          ]),
          itemListJsonLd(category.name, items),
        ]}
      />
      <ShopView
        title={category.name}
        basePath={`/category/${slug}`}
        params={query}
        products={items}
        meta={meta}
      />
    </>
  );
}
