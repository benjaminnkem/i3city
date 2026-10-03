"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ShopParams } from "@/lib/store/api";
import { priceLabel } from "@/lib/store/price-presets";
import { shopQueryString } from "@/lib/store/shop-params";

interface Chip {
  key: string;
  label: string;
  clear: Partial<ShopParams>;
}

function chipsFor(params: ShopParams): Chip[] {
  const chips: Chip[] = [];
  if (params.search) {
    chips.push({
      key: "search",
      label: `“${params.search}”`,
      clear: { search: undefined },
    });
  }
  const price = priceLabel(params.minPrice, params.maxPrice);
  if (price) {
    chips.push({
      key: "price",
      label: price,
      clear: { minPrice: undefined, maxPrice: undefined },
    });
  }
  if (params.inStock) {
    chips.push({
      key: "stock",
      label: "In stock",
      clear: { inStock: undefined },
    });
  }
  return chips;
}

export function ActiveFilters({
  basePath,
  params,
}: Readonly<{ basePath: string; params: ShopParams }>) {
  const router = useRouter();
  const chips = chipsFor(params);
  if (chips.length === 0) return null;

  function clear(overrides: Partial<ShopParams>) {
    router.push(
      `${basePath}${shopQueryString(params, { ...overrides, page: 1 })}`,
      { scroll: false },
    );
  }

  const clearAll = {
    search: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
  };

  return (
    <ul aria-label="Active filters" className="mt-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Remove filter: ${chip.label}`}
            onClick={() => clear(chip.clear)}
          >
            {chip.label}
            <XIcon data-icon="inline-end" />
          </Button>
        </li>
      ))}
      {chips.length > 1 ? (
        <li>
          <Button variant="ghost" size="sm" onClick={() => clear(clearAll)}>
            Clear all
          </Button>
        </li>
      ) : null}
    </ul>
  );
}
