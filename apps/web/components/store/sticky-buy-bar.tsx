"use client";

import { formatNaira } from "@repo/types";
import { AddToCart } from "./add-to-cart";
import type { CartLine } from "@/lib/cart/store";

export function StickyBuyBar({
  product,
}: Readonly<{ product: Omit<CartLine, "quantity"> }>) {
  return (
    <div className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t px-4 py-3 backdrop-blur md:hidden">
      <span className="price text-price font-extrabold">
        {formatNaira(product.price)}
      </span>
      <AddToCart
        product={product}
        size="default"
        showQuantity={false}
        showStatus={false}
        className="flex-1"
      />
    </div>
  );
}
