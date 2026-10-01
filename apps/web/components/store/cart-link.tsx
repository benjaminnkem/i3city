"use client";

import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/use-cart";

export function CartLink() {
  const { count } = useCart();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      nativeButton={false}
      aria-label={
        count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"
      }
      render={<Link href="/cart" />}
    >
      <ShoppingBagIcon />
      {count > 0 ? (
        <span className="bg-primary text-primary-foreground price absolute top-1 right-1 grid min-w-5 place-items-center rounded-pill px-1 text-xs font-extrabold">
          {count}
        </span>
      ) : null}
    </Button>
  );
}
