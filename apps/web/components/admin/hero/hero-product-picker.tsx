"use client";

import {
  formatNaira,
  HERO_LIMITS,
  type AdminProduct,
  type HeroSlideProduct,
} from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ProductThumb } from "@/components/admin/products/product-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_PRODUCT_FILTERS,
  listProducts,
  productKeys,
} from "@/lib/admin/products";

const SEARCH_DELAY_MS = 300;
const RESULT_LIMIT = 6;

function toSlideProduct(product: AdminProduct): HeroSlideProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    imageUrl: product.imageUrls[0] ?? null,
    active: product.active,
  };
}

function ProductLine({
  product,
  children,
}: Readonly<{ product: HeroSlideProduct; children: React.ReactNode }>) {
  return (
    <li className="flex items-center gap-3 py-2">
      <ProductThumb url={product.imageUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-bold">{product.name}</span>
        <span className="text-muted-foreground text-small flex items-center gap-2">
          <span className="price">{formatNaira(product.price)}</span>
          {product.active ? null : <Badge variant="outline">Hidden</Badge>}
        </span>
      </div>
      <div className="flex items-center">{children}</div>
    </li>
  );
}

export function HeroProductPicker({
  selected,
  onChange,
}: Readonly<{
  selected: HeroSlideProduct[];
  onChange: (products: HeroSlideProduct[]) => void;
}>) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(
      () => setSearch(draft.trim()),
      SEARCH_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [draft]);

  const filters = {
    ...DEFAULT_PRODUCT_FILTERS,
    search,
    limit: RESULT_LIMIT,
  };
  const results = useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => listProducts(filters),
  });
  const full = selected.length >= HERO_LIMITS.products;
  const chosen = new Set(selected.map((product) => product.id));

  function move(index: number, offset: number) {
    const next = [...selected];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + offset, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {selected.length > 0 ? (
        <ol className="divide-border divide-y">
          {selected.map((product, index) => (
            <ProductLine key={product.id} product={product}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${product.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move ${product.name} down`}
                disabled={index === selected.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${product.name}`}
                onClick={() =>
                  onChange(selected.filter((item) => item.id !== product.id))
                }
              >
                <XIcon />
              </Button>
            </ProductLine>
          ))}
        </ol>
      ) : null}

      <div className="bg-muted flex flex-col gap-2 rounded-md p-3">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <Input
            type="search"
            aria-label="Search products to add"
            placeholder={
              full
                ? `You picked ${HERO_LIMITS.products}. Remove one to add another.`
                : "Search products to add"
            }
            disabled={full}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="bg-background pl-10"
          />
        </div>
        {full ? null : results.data ? (
          results.data.items.length > 0 ? (
            <ul className="divide-border divide-y">
              {results.data.items.map((product) => {
                const item = toSlideProduct(product);
                return (
                  <ProductLine key={product.id} product={item}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={chosen.has(product.id)}
                      onClick={() => onChange([...selected, item])}
                    >
                      <PlusIcon data-icon="inline-start" />
                      {chosen.has(product.id) ? "Added" : "Add"}
                    </Button>
                  </ProductLine>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-small px-1 py-2">
              No products match &ldquo;{search}&rdquo;.
            </p>
          )
        ) : (
          <Skeleton className="h-40 rounded-sm" />
        )}
      </div>
    </div>
  );
}
