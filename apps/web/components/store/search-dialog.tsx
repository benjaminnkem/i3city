"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  clearRecentSearches,
  readRecentSearches,
  saveRecentSearch,
} from "@/lib/store/recent-searches";
import { useProductSearch } from "@/lib/store/use-product-search";
import {
  ClearTermButton,
  SearchPanel,
  type CategoryLink,
} from "./search-panel";

export function SearchDialog({
  categories,
}: Readonly<{ categories: CategoryLink[] }>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const search = useProductSearch(term);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setTerm("");
      setRecent(readRecentSearches());
    }
  }

  function finish(searched?: string) {
    if (searched) setRecent(saveRecentSearch(searched));
    setOpen(false);
  }

  function goToShop(value: string) {
    const clean = value.trim();
    finish(clean);
    router.push(clean ? `/shop?search=${encodeURIComponent(clean)}` : "/shop");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToShop(term);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search products"
          />
        }
      >
        <SearchIcon />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto p-4"
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <DialogDescription className="sr-only">
          Search by product name, brand or category.
        </DialogDescription>
        <form
          role="search"
          onSubmit={submit}
          className="flex items-center gap-2"
        >
          <div className="bg-muted focus-within:border-ring flex h-12 min-w-0 flex-1 items-center gap-2 rounded-pill border border-transparent pr-2 pl-4">
            <SearchIcon className="text-muted-foreground size-5 shrink-0" />
            <input
              type="search"
              name="search"
              autoFocus
              autoComplete="off"
              enterKeyHint="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              aria-label="Search products"
              placeholder="Search products"
              className="min-w-0 flex-1 bg-transparent outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {term ? <ClearTermButton onClick={() => setTerm("")} /> : null}
          </div>
          <Button type="submit" size="lg">
            Search
          </Button>
        </form>
        <SearchPanel
          term={term}
          search={search}
          recent={recent}
          categories={categories}
          onNavigate={finish}
          onPickRecent={goToShop}
          onClearRecent={() => {
            clearRecentSearches();
            setRecent([]);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
