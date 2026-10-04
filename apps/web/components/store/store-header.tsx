import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchCategories } from "@/lib/store/api";
import { CartLink } from "./cart-link";
import { CategoryNav } from "./category-nav";
import { SearchDialog } from "./search-dialog";

export async function StoreHeader() {
  const categories = await fetchCategories().catch(() => []);
  return (
    <header className="bg-background/90 border-border sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto grid w-full max-w-page grid-cols-[1fr_auto] items-center gap-x-2 px-4 py-1 md:grid-cols-[auto_1fr_auto] md:gap-x-8 md:px-8 md:py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center"
          aria-label="i3City home"
        >
          <Logo className="text-2xl" />
        </Link>
        <div className="flex items-center justify-end gap-1 md:order-3">
          <Link
            href="/track"
            className="text-muted-foreground hover:text-foreground hidden min-h-11 items-center px-3 text-sm font-bold sm:flex"
          >
            Track order
          </Link>
          <SearchDialog categories={categories} />
          <ThemeToggle />
          <CartLink />
        </div>
        <form
          action="/shop"
          role="search"
          className="bg-muted focus-within:border-ring hidden h-11 items-center gap-2 rounded-pill border border-transparent px-4 md:flex md:w-full md:max-w-xl md:justify-self-center"
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
      <CategoryNav categories={categories} />
    </header>
  );
}
