import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchCategories } from "@/lib/store/api";
import { CartLink } from "./cart-link";

export async function StoreHeader() {
  const categories = await fetchCategories().catch(() => []);
  return (
    <header className="bg-background/90 border-border sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto grid w-full max-w-page grid-cols-[1fr_auto] items-center gap-x-2 gap-y-2 px-4 py-3 md:grid-cols-[auto_1fr_auto] md:gap-x-8 md:px-8">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight"
          aria-label="i3City home"
        >
          i3<span className="text-primary">city</span>
        </Link>
        <div className="flex items-center justify-end gap-1 md:order-3">
          <Link
            href="/track"
            className="text-muted-foreground hover:text-foreground hidden px-3 text-sm font-bold sm:block"
          >
            Track order
          </Link>
          <ThemeToggle />
          <CartLink />
        </div>
        <form
          action="/shop"
          role="search"
          className="bg-muted focus-within:border-ring col-span-2 flex h-11 items-center gap-2 rounded-pill border border-transparent px-4 md:col-span-1 md:max-w-xl md:justify-self-center md:w-full"
        >
          <SearchIcon className="text-muted-foreground size-5 shrink-0" />
          <input
            type="search"
            name="search"
            aria-label="Search products"
            placeholder="Search phones, chargers, earbuds"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </form>
      </div>
      <nav aria-label="Categories" className="border-border border-t">
        <ul className="mx-auto flex w-full max-w-page gap-1 overflow-x-auto px-4 md:px-8">
          <li>
            <Link
              href="/shop"
              className="block px-3 py-2.5 text-sm font-bold whitespace-nowrap hover:text-primary"
            >
              All products
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className="text-muted-foreground block px-3 py-2.5 text-sm font-medium whitespace-nowrap hover:text-primary"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
