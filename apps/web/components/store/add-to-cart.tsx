"use client";

import { MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const setQuantity = useCartStore((state) => state.setQuantity);
  const inCart = useCartStore(
    (state) =>
      state.lines.find((line) => line.productId === product.productId)
        ?.quantity ?? 0,
  );
  const soldOut = product.stock === 0;

  if (inCart > 0) {
    return (
      <div
        role="group"
        aria-label={`${product.name} quantity`}
        className={cn(
          "border-foreground flex h-11 w-full items-center justify-between rounded-pill border-2",
          className,
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-pill"
          aria-label={
            inCart === 1
              ? `Remove ${product.name} from cart`
              : `Decrease ${product.name} quantity`
          }
          onClick={() => setQuantity(product.productId, inCart - 1)}
        >
          {inCart === 1 ? <Trash2Icon /> : <MinusIcon />}
        </Button>
        <span className="price font-extrabold" aria-live="polite">
          {inCart} in cart
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-pill"
          aria-label={`Increase ${product.name} quantity`}
          disabled={inCart >= product.stock}
          onClick={() => add(product, 1)}
        >
          <PlusIcon />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className={cn("w-full", className)}
      disabled={soldOut}
      onClick={() => add(product, 1)}
    >
      {soldOut ? "Out of stock" : "Add to cart"}
    </Button>
  );
}

export function AddToCart({
  product,
  size = "lg",
  showQuantity = true,
  showStatus = true,
  className,
}: Readonly<{
  product: Product;
  size?: "default" | "lg";
  showQuantity?: boolean;
  showStatus?: boolean;
  className?: string;
}>) {
  const router = useRouter();
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
          toast.success(`${amount} × ${product.name} added to your cart`, {
            action: { label: "View cart", onClick: () => router.push("/cart") },
          });
        }}
      >
        <ShoppingBagIcon data-icon="inline-start" />
        {soldOut
          ? "Out of stock"
          : maxed
            ? "All in your cart"
            : inCart > 0
              ? "Add more"
              : "Add to cart"}
      </Button>
      {showStatus && inCart > 0 ? (
        <p className="text-muted-foreground w-full text-sm" aria-live="polite">
          <span className="price text-foreground font-bold">{inCart}</span> in
          your cart.{" "}
          <Link href="/cart" className="text-primary font-bold underline">
            View cart
          </Link>
        </p>
      ) : null}
    </div>
  );
}
