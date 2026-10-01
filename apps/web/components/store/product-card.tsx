import {
  formatNaira,
  LOW_STOCK_THRESHOLD,
  type PublicProduct,
} from "@repo/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuickAdd } from "./add-to-cart";
import { ProductImage } from "./product-image";

const TONES = ["bg-tone-1", "bg-tone-2", "bg-tone-3", "bg-tone-4"] as const;

export function ProductCard({
  product,
  index = 0,
  priority = false,
}: Readonly<{ product: PublicProduct; index?: number; priority?: boolean }>) {
  const soldOut = product.stock === 0;
  const saving = product.compareAtPrice
    ? product.compareAtPrice - product.price
    : 0;
  return (
    <article className="flex min-w-0 flex-col gap-3">
      <Link
        href={`/product/${product.slug}`}
        aria-label={product.name}
        className={cn(
          "relative block aspect-square overflow-hidden rounded-md",
          TONES[index % TONES.length],
        )}
      >
        <ProductImage
          src={product.imageUrls[0]}
          alt={product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className={soldOut ? "opacity-40" : undefined}
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
          {soldOut ? (
            <Badge variant="outline" className="bg-background">
              Out of stock
            </Badge>
          ) : null}
          {!soldOut && saving > 0 ? (
            <Badge>Save {formatNaira(saving)}</Badge>
          ) : null}
          {!soldOut && product.stock <= LOW_STOCK_THRESHOLD ? (
            <Badge variant="outline" className="bg-background text-warning">
              Only {product.stock} left
            </Badge>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-col gap-1">
        {product.category ? (
          <span className="text-muted-foreground text-small">
            {product.category.name}
          </span>
        ) : null}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-h3 min-w-0 font-bold">
            <Link href={`/product/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <div className="flex shrink-0 flex-col items-end leading-tight">
            <span className="price text-price font-extrabold">
              {formatNaira(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="price text-muted-foreground text-small line-through">
                {formatNaira(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <QuickAdd
        product={{
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrls[0] ?? null,
          stock: product.stock,
        }}
      />
    </article>
  );
}
