"use client";

import type { PublicCategory } from "@repo/types";
import Link from "next/link";
import { useScrollEdges } from "@/hooks/use-scroll-edges";

export function CategoryPills({
  categories,
}: Readonly<{ categories: PublicCategory[] }>) {
  const { ref, measure, style } = useScrollEdges<HTMLUListElement>();
  return (
    <nav aria-label="Shop by category">
      <ul
        ref={ref}
        onScroll={measure}
        style={style}
        className="-mx-4 flex snap-x snap-proximity scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:gap-3 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => (
          <li key={category.id} className="min-w-0 shrink-0 snap-start">
            <Link
              href={`/category/${category.slug}`}
              className="bg-accent text-accent-foreground focus-visible:ring-ring/50 hover:bg-primary hover:text-primary-foreground inline-flex min-h-11 max-w-60 items-center gap-2 rounded-4xl py-1 pr-1.5 pl-4 font-bold transition-transform duration-200 outline-none focus-visible:ring-3 active:scale-[0.97] md:min-h-12 md:hover:-translate-y-0.5"
            >
              <span className="truncate">{category.name}</span>
              <span className="price bg-background text-muted-foreground grid h-7 min-w-7 shrink-0 place-items-center rounded-4xl px-2 text-xs font-semibold">
                {category.productCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
