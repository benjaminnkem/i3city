import type { PaginationMeta, PublicProduct } from "@repo/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Container } from "@/components/store/section";
import type { ShopParams } from "@/lib/store/api";
import { shopQueryString } from "@/lib/store/shop-params";
import { ProductCard } from "./product-card";
import { ShopFilters } from "./shop-filters";

function Pager({
  basePath,
  params,
  meta,
}: Readonly<{ basePath: string; params: ShopParams; meta: PaginationMeta }>) {
  if (meta.totalPages <= 1) return null;
  const href = (page: number) =>
    `${basePath}${shopQueryString(params, { page })}`;
  return (
    <nav
      aria-label="Pages"
      className="mt-10 flex items-center justify-center gap-3"
    >
      <Button
        variant="outline"
        nativeButton={false}
        disabled={meta.page <= 1}
        render={
          meta.page <= 1 ? (
            <span />
          ) : (
            <Link href={href(meta.page - 1)} rel="prev" />
          )
        }
      >
        <ChevronLeftIcon data-icon="inline-start" />
        Previous
      </Button>
      <span className="price text-muted-foreground">
        Page {meta.page} of {meta.totalPages}
      </span>
      <Button
        variant="outline"
        nativeButton={false}
        disabled={meta.page >= meta.totalPages}
        render={
          meta.page >= meta.totalPages ? (
            <span />
          ) : (
            <Link href={href(meta.page + 1)} rel="next" />
          )
        }
      >
        Next
        <ChevronRightIcon data-icon="inline-end" />
      </Button>
    </nav>
  );
}

export function ShopView({
  title,
  description,
  basePath,
  params,
  products,
  meta,
}: Readonly<{
  title: string;
  description?: string;
  basePath: string;
  params: ShopParams;
  products: PublicProduct[];
  meta: PaginationMeta;
}>) {
  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h2 font-extrabold">{title}</h1>
        <p className="text-muted-foreground">
          {description ??
            `${meta.total} ${meta.total === 1 ? "product" : "products"}`}
        </p>
      </div>
      <ShopFilters basePath={basePath} params={params} />
      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted mt-8 flex flex-col items-center gap-3 rounded-lg px-6 py-16 text-center">
          <h2 className="text-h3 text-lg font-extrabold">No products match</h2>
          <p className="text-muted-foreground">
            Try a different search or clear the filters.
          </p>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={basePath} />}
          >
            Clear filters
          </Button>
        </div>
      )}
      <Pager basePath={basePath} params={params} meta={meta} />
    </Container>
  );
}
