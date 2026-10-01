"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SHOP_SORTS, type ShopSort } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ShopParams } from "@/lib/store/api";
import { shopQueryString } from "@/lib/store/shop-params";

const SORT_LABELS: Record<ShopSort, string> = {
  newest: "Newest",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
};

const SORT_ITEMS = SHOP_SORTS.map((value) => ({
  value,
  label: SORT_LABELS[value],
}));

export function ShopFilters({
  basePath,
  params,
}: Readonly<{ basePath: string; params: ShopParams }>) {
  const router = useRouter();
  const [min, setMin] = useState(params.minPrice?.toString() ?? "");
  const [max, setMax] = useState(params.maxPrice?.toString() ?? "");
  const [priceOpen, setPriceOpen] = useState(false);

  function go(overrides: Partial<ShopParams>) {
    router.push(
      `${basePath}${shopQueryString(params, { ...overrides, page: 1 })}`,
      {
        scroll: false,
      },
    );
  }

  function applyPrice() {
    const low = /^\d+$/.test(min) ? Number(min) : undefined;
    const high = /^\d+$/.test(max) ? Number(max) : undefined;
    go({ minPrice: low, maxPrice: high });
    setPriceOpen(false);
  }

  const priceActive =
    params.minPrice !== undefined || params.maxPrice !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        items={SORT_ITEMS}
        value={params.sort ?? "newest"}
        onValueChange={(value) => go({ sort: (value ?? "newest") as ShopSort })}
      >
        <SelectTrigger aria-label="Sort" className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger
          render={<Button variant={priceActive ? "default" : "outline"} />}
        >
          <SlidersHorizontalIcon data-icon="inline-start" />
          Price
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              applyPrice();
            }}
          >
            <PopoverHeader>
              <PopoverTitle>Price range</PopoverTitle>
            </PopoverHeader>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="min-price">From (₦)</Label>
                <Input
                  id="min-price"
                  inputMode="numeric"
                  value={min}
                  onChange={(event) => setMin(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="max-price">To (₦)</Label>
                <Input
                  id="max-price"
                  inputMode="numeric"
                  value={max}
                  onChange={(event) => setMax(event.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Apply
              </Button>
              {priceActive ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMin("");
                    setMax("");
                    go({ minPrice: undefined, maxPrice: undefined });
                    setPriceOpen(false);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </form>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2">
        <Switch
          id="in-stock"
          checked={params.inStock === true}
          onCheckedChange={(checked) =>
            go({ inStock: checked ? true : undefined })
          }
        />
        <Label htmlFor="in-stock">In stock only</Label>
      </div>
    </div>
  );
}
