import { formatNaira, type PublicProduct } from "@repo/types";
import Link from "next/link";
import { RevealItem, Stagger } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

const TILES = [
  {
    tone: "bg-tone-1",
    slot: "col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2 md:aspect-auto",
    tilt: "md:-rotate-2",
  },
  {
    tone: "bg-tone-2",
    slot: "aspect-square md:aspect-auto",
    tilt: "md:rotate-2",
  },
  {
    tone: "bg-tone-3",
    slot: "aspect-square md:aspect-auto",
    tilt: "md:-rotate-1",
  },
] as const;

export function HomeHero({
  products,
  whatsappHref,
}: Readonly<{ products: PublicProduct[]; whatsappHref: string }>) {
  const shown = products.slice(0, TILES.length);
  return (
    <section
      aria-label="Welcome"
      className="grid items-center gap-6 md:grid-cols-[1.1fr_1fr] md:gap-8"
    >
      <div className="flex flex-col gap-4 md:gap-6 md:py-8">
        <h1 className="text-display animate-rise-1 font-extrabold">
          Gadgets that earn their place.
        </h1>
        <p className="text-muted-foreground animate-rise-2 max-w-[34ch] text-lg">
          Phones, audio and everyday accessories, delivered anywhere in Nigeria.
        </p>
        <div className="animate-rise-3 flex gap-2 md:flex-wrap md:gap-3">
          <Button
            size="lg"
            className="max-md:h-11 max-md:px-4"
            nativeButton={false}
            render={<Link href="/shop" />}
          >
            Shop all products
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="max-md:h-11 max-md:px-4"
            nativeButton={false}
            render={<Link href={whatsappHref} />}
          >
            Ask on WhatsApp
          </Button>
        </div>
      </div>
      {shown.length > 0 ? (
        <Stagger
          trigger="mount"
          gap="loose"
          delay={0.2}
          className="grid grid-cols-2 gap-3 md:aspect-[5/4] md:grid-rows-2 md:gap-5"
        >
          {shown.map((product, index) => {
            const tile = TILES[index];
            if (!tile) return null;
            const alone = shown.length === 1;
            const pair = shown.length === 2;
            const saving = product.compareAtPrice
              ? product.compareAtPrice - product.price
              : 0;
            return (
              <RevealItem
                key={product.id}
                variant="scale"
                className={cn(
                  "min-w-0",
                  tile.slot,
                  alone && "col-span-2 md:col-span-2",
                  pair && index === 1 && "md:row-span-2",
                )}
              >
                <Link
                  href={`/product/${product.slug}`}
                  className={cn(
                    "group relative flex size-full flex-col justify-between overflow-hidden rounded-md p-3 transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-[1.02] active:scale-[0.98] md:p-4",
                    tile.tone,
                    tile.tilt,
                  )}
                >
                  <ProductImage
                    src={product.imageUrls[0]}
                    alt=""
                    sizes="(min-width: 768px) 30vw, 90vw"
                    priority={index === 0}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="relative flex items-start">
                    {saving > 0 ? (
                      <Badge>Save {formatNaira(saving)}</Badge>
                    ) : null}
                  </div>
                  <div className="bg-background/95 relative flex w-fit max-w-full flex-col rounded-md px-4 py-2 shadow-sm">
                    <span className="text-h3 truncate font-bold">
                      {product.name}
                    </span>
                    <span className="price text-primary font-bold">
                      {formatNaira(product.price)}
                    </span>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </Stagger>
      ) : null}
    </section>
  );
}
