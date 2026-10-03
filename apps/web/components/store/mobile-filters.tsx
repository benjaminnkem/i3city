"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { ShopParams } from "@/lib/store/api";
import { PRICE_PRESETS } from "@/lib/store/price-presets";
import { shopQueryString } from "@/lib/store/shop-params";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function toNumber(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

export function MobileFilters({
  basePath,
  params,
}: Readonly<{ basePath: string; params: ShopParams }>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [inStock, setInStock] = useState(false);

  const count =
    (params.minPrice !== undefined || params.maxPrice !== undefined ? 1 : 0) +
    (params.inStock ? 1 : 0);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setMin(params.minPrice?.toString() ?? "");
      setMax(params.maxPrice?.toString() ?? "");
      setInStock(params.inStock === true);
    }
  }

  function apply(next: Partial<ShopParams>) {
    router.push(`${basePath}${shopQueryString(params, { ...next, page: 1 })}`, {
      scroll: false,
    });
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="outline" />}>
        <SlidersHorizontalIcon data-icon="inline-start" />
        Filters
        {count > 0 ? (
          <span className="bg-primary text-primary-foreground price grid size-5 place-items-center rounded-pill text-xs font-extrabold">
            {count}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-md"
      >
        <SheetHeader>
          <SheetTitle className="text-h3 text-lg font-extrabold">
            Filters
          </SheetTitle>
          <SheetDescription>
            Narrow the products by price and stock.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-bold">Price</legend>
            <ul className="flex flex-wrap gap-2">
              {PRICE_PRESETS.map((preset) => {
                const selected =
                  toNumber(min) === preset.minPrice &&
                  toNumber(max) === preset.maxPrice;
                return (
                  <li key={preset.label}>
                    <Button
                      type="button"
                      variant={selected ? "default" : "secondary"}
                      aria-pressed={selected}
                      onClick={() => {
                        setMin(preset.minPrice?.toString() ?? "");
                        setMax(preset.maxPrice?.toString() ?? "");
                      }}
                    >
                      {preset.label}
                    </Button>
                  </li>
                );
              })}
            </ul>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="filter-min">From (₦)</Label>
                <Input
                  id="filter-min"
                  inputMode="numeric"
                  value={min}
                  onChange={(event) => setMin(digits(event.target.value))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="filter-max">To (₦)</Label>
                <Input
                  id="filter-max"
                  inputMode="numeric"
                  value={max}
                  onChange={(event) => setMax(digits(event.target.value))}
                />
              </div>
            </div>
          </fieldset>
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="filter-stock" className="font-bold">
              In stock only
            </Label>
            <Switch
              id="filter-stock"
              checked={inStock}
              onCheckedChange={setInStock}
            />
          </div>
        </div>
        <SheetFooter className="flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              apply({
                minPrice: undefined,
                maxPrice: undefined,
                inStock: undefined,
              })
            }
          >
            Clear
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() =>
              apply({
                minPrice: toNumber(min),
                maxPrice: toNumber(max),
                inStock: inStock ? true : undefined,
              })
            }
          >
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
