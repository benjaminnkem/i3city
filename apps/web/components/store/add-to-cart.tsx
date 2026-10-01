"use client";

import { MinusIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartLine } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

type Product = Omit<CartLine, "quantity">;

export function QuickAdd({
  product,
  className,
}: Readonly<{ product: Product; className?: string }>) {
  const add = useCartStore((state) => state.add);
  const soldOut = product.stock === 0;
  return (
    <Button
      variant="outline"
      className={cn("w-full", className)}
      disabled={soldOut}
      onClick={() => {
        add(product, 1);
        toast.success(`${product.name} added to your cart`);
      }}
    >
      {soldOut ? "Out of stock" : "Add to cart"}
    </Button>
  );
}

export function AddToCart({
  product,
  size = "lg",
  showQuantity = true,
  className,
}: Readonly<{
  product: Product;
  size?: "default" | "lg";
  showQuantity?: boolean;
  className?: string;
}>) {
  const add = useCartStore((state) => state.add);
  const inCart = useCartStore(
    (state) =>
      state.lines.find((line) => line.productId === product.productId)
        ?.quantity ?? 0,
  );
  const [quantity, setQuantity] = useState(1);
  const room = Math.max(product.stock - inCart, 0);
  const soldOut = product.stock === 0;
  const maxed = !soldOut && room === 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {showQuantity && !soldOut ? (
        <div
          className="border-input flex items-center rounded-pill border"
          role="group"
          aria-label="Quantity"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          >
            <MinusIcon />
          </Button>
          <span
            className="price min-w-8 text-center font-bold"
            aria-live="polite"
          >
            {Math.min(quantity, Math.max(room, 1))}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            disabled={quantity >= room}
            onClick={() =>
              setQuantity((current) => Math.min(room, current + 1))
            }
          >
            <PlusIcon />
          </Button>
        </div>
      ) : null}
      <Button
        type="button"
        size={size}
        className="flex-1"
        disabled={soldOut || maxed}
        onClick={() => {
          const amount = Math.min(quantity, room);
          add(product, amount);
          setQuantity(1);
          toast.success(`${amount} × ${product.name} added to your cart`);
        }}
      >
        <ShoppingBagIcon data-icon="inline-start" />
        {soldOut ? "Out of stock" : maxed ? "All in your cart" : "Add to cart"}
      </Button>
    </div>
  );
}
