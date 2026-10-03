"use client";

import { formatNaira } from "@repo/types";
import { ClockIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductSearch } from "@/lib/store/use-product-search";
import { ProductImage } from "./product-image";

export type CategoryLink = Readonly<{ id: string; name: string; slug: string }>;

function CategoryChips({
  categories,
  onNavigate,
}: Readonly<{ categories: CategoryLink[]; onNavigate: () => void }>) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-small font-medium">
        Browse by category
      </p>
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.id}>
            <Button
              variant="secondary"
              className="h-11"
              nativeButton={false}
              render={<Link href={`/category/${category.slug}`} />}
              onClick={onNavigate}
            >
              {category.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentSearches({
  recent,
  onPick,
  onClear,
}: Readonly<{
  recent: string[];
  onPick: (term: string) => void;
  onClear: () => void;
}>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-small font-medium">
          Recent searches
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-primary text-small inline-flex min-h-11 items-center px-2 font-bold"
        >
          Clear
        </button>
      </div>
      <ul className="flex flex-col">
        {recent.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onPick(term)}
              className="hover:bg-muted flex min-h-11 w-full items-center gap-3 rounded-sm px-2 text-left"
            >
              <ClockIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{term}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultRows({
  term,
  search,
  onNavigate,
}: Readonly<{
  term: string;
  search: Extract<ProductSearch, { status: "done" }>;
  onNavigate: () => void;
}>) {
  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col">
        {search.items.map((product) => (
          <li key={product.id}>
            <Link
              href={`/product/${product.slug}`}
              onClick={onNavigate}
              className="hover:bg-muted flex min-h-16 items-center gap-3 rounded-sm p-2"
            >
              <span className="bg-tone-1 relative size-12 shrink-0 overflow-hidden rounded-sm">
                <ProductImage src={product.imageUrls[0]} alt="" sizes="48px" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-bold">{product.name}</span>
                {product.category ? (
                  <span className="text-muted-foreground text-small truncate">
                    {product.category.name}
                  </span>
                ) : null}
              </span>
              <span className="price text-primary font-bold">
                {formatNaira(product.price)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {search.total > search.items.length ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/shop?search=${encodeURIComponent(term)}`} />}
          onClick={onNavigate}
        >
          See all {search.total} results
        </Button>
      ) : null}
    </div>
  );
}

export function SearchPanel({
  term,
  search,
  recent,
  categories,
  onNavigate,
  onPickRecent,
  onClearRecent,
}: Readonly<{
  term: string;
  search: ProductSearch;
  recent: string[];
  categories: CategoryLink[];
  onNavigate: (term?: string) => void;
  onPickRecent: (term: string) => void;
  onClearRecent: () => void;
}>) {
  const clean = term.trim();
  if (search.status === "idle") {
    return (
      <div className="flex flex-col gap-5">
        {recent.length > 0 ? (
          <RecentSearches
            recent={recent}
            onPick={onPickRecent}
            onClear={onClearRecent}
          />
        ) : null}
        <CategoryChips
          categories={categories}
          onNavigate={() => onNavigate()}
        />
      </div>
    );
  }
  if (search.status === "loading") {
    return (
      <div className="flex flex-col gap-1" aria-busy="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex min-h-16 items-center gap-3 p-2">
            <Skeleton className="size-12 rounded-sm" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (search.status === "error") {
    return (
      <p className="text-muted-foreground" role="status">
        Search is not working right now. Press Search to see results on the shop
        page.
      </p>
    );
  }
  if (search.items.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-muted-foreground" role="status">
          Nothing matches{" "}
          <span className="text-foreground font-bold">{clean}</span>. Check the
          spelling or browse a category.
        </p>
        <CategoryChips
          categories={categories}
          onNavigate={() => onNavigate()}
        />
      </div>
    );
  }
  return (
    <ResultRows
      term={clean}
      search={search}
      onNavigate={() => onNavigate(clean)}
    />
  );
}

export function ClearTermButton({
  onClick,
}: Readonly<{ onClick: () => void }>) {
  return (
    <button
      type="button"
      aria-label="Clear search"
      onClick={onClick}
      className="text-muted-foreground -mr-1 grid size-11 shrink-0 place-items-center rounded-pill"
    >
      <XIcon className="size-4" />
    </button>
  );
}
