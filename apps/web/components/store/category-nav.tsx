"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useScrollEdges } from "@/hooks/use-scroll-edges";
import { cn } from "@/lib/utils";

type CategoryLink = Readonly<{ id: string; name: string; slug: string }>;

function linkClass(active: boolean): string {
  return cn(
    "flex min-h-11 items-center border-b-2 px-3 text-sm whitespace-nowrap hover:text-primary",
    active
      ? "border-primary text-foreground font-bold"
      : "text-muted-foreground border-transparent font-medium",
  );
}

export function CategoryNav({
  categories,
}: Readonly<{ categories: CategoryLink[] }>) {
  const pathname = usePathname();
  const { ref: list, measure, style } = useScrollEdges<HTMLUListElement>();

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const active = element.querySelector<HTMLElement>("[aria-current=page]");
    if (active) {
      element.scrollLeft =
        active.offsetLeft - (element.clientWidth - active.clientWidth) / 2;
    }
    measure();
  }, [pathname, list, measure]);

  const onAll = pathname === "/shop";
  return (
    <nav aria-label="Categories" className="border-border border-t">
      <ul
        ref={list}
        onScroll={measure}
        style={style}
        className="mx-auto flex w-full max-w-page gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden"
      >
        <li>
          <Link
            href="/shop"
            aria-current={onAll ? "page" : undefined}
            className={linkClass(onAll)}
          >
            All products
          </Link>
        </li>
        {categories.map((category) => {
          const href = `/category/${category.slug}`;
          const active = pathname === href;
          return (
            <li key={category.id}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
