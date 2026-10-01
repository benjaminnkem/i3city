"use client";

import { formatNaira } from "@repo/types";
import { MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/lib/cart/store";
import { useCart } from "@/lib/cart/use-cart";
import { useValidatedCart } from "@/lib/cart/use-validated-cart";
import { Container } from "./section";
import { ProductImage } from "./product-image";

export function CartView() {
  const { ready, lines, subtotal, count } = useCart();
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const { notices, checking, failed } = useValidatedCart();

  if (!ready || checking) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <Skeleton className="h-64 rounded-md" />
      </Container>
    );
  }

  if (lines.length === 0) {
    return (
      <Container className="flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBagIcon
          className="text-muted-foreground size-12"
          strokeWidth={1.25}
        />
        <h1 className="text-h2 font-extrabold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Find something you like and it will wait for you here.
        </p>
        <Button size="lg" nativeButton={false} render={<Link href="/shop" />}>
          Start shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="text-h2 mb-6 font-extrabold">Your cart</h1>
      {notices.length > 0 ? (
        <Alert className="mb-6">
          <AlertTitle>We updated your cart</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {notices.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      {failed ? (
        <Alert className="mb-6">
          <AlertTitle>We could not check your cart</AlertTitle>
          <AlertDescription>
            Prices and stock are confirmed again at checkout.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-border divide-y">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-4 py-5">
              <Link
                href={`/product/${line.slug}`}
                className="bg-tone-1 relative size-24 shrink-0 overflow-hidden rounded-md sm:size-28"
              >
                <ProductImage
                  src={line.imageUrl}
                  alt={line.name}
                  sizes="112px"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/product/${line.slug}`}
                    className="font-bold hover:underline"
                  >
                    {line.name}
                  </Link>
                  <span className="price font-extrabold">
                    {formatNaira(line.price * line.quantity)}
                  </span>
                </div>
                <span className="price text-muted-foreground text-sm">
                  {formatNaira(line.price)} each
                </span>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <div
                    className="border-input flex items-center rounded-pill border"
                    role="group"
                    aria-label={`Quantity for ${line.name}`}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Decrease quantity of ${line.name}`}
                      onClick={() =>
                        setQuantity(line.productId, line.quantity - 1)
                      }
                    >
                      <MinusIcon />
                    </Button>
                    <span className="price min-w-8 text-center font-bold">
                      {line.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Increase quantity of ${line.name}`}
                      disabled={line.quantity >= line.stock}
                      onClick={() =>
                        setQuantity(line.productId, line.quantity + 1)
                      }
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(line.productId)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="bg-muted h-fit rounded-lg p-6 lg:sticky lg:top-40">
          <h2 className="mb-4 text-lg font-extrabold">Order summary</h2>
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Subtotal ({count} {count === 1 ? "item" : "items"})
              </dt>
              <dd className="price font-bold">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-muted-foreground">Calculated at checkout</dd>
            </div>
          </dl>
          <Button
            size="lg"
            className="mt-6 w-full"
            nativeButton={false}
            render={<Link href="/checkout" />}
          >
            Checkout
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full"
            nativeButton={false}
            render={<Link href="/shop" />}
          >
            Keep shopping
          </Button>
        </aside>
      </div>
    </Container>
  );
}
