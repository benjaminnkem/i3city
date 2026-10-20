import {
  formatNaira,
  HERO_WHATSAPP_HREF,
  type HeroTileProduct,
  type PublicHeroSlide,
  type PublicProduct,
} from "@repo/types";
import Link from "next/link";
import { RevealItem, Stagger } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductImage } from "../product-image";
import { HERO_TONE_CLASS, heroHref } from "./hero-link";

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

export type HeroProductsContent = Pick<
  PublicHeroSlide,
  "headline" | "subtext" | "ctaLabel" | "ctaHref" | "tone"
> & { products: HeroTileProduct[] };

export function toTileProduct(product: PublicProduct): HeroTileProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    imageUrl: product.imageUrls[0] ?? null,
  };
}

function Collage({
  products,
  onPanel,
  first,
}: Readonly<{
  products: HeroTileProduct[];
  onPanel: boolean;
  first: boolean;
}>) {
  const shown = products.slice(0, TILES.length);
  const tiles = shown.map((product, index) => {
    const tile = TILES[index];
    if (!tile) return null;
    const alone = shown.length === 1;
    const pair = shown.length === 2;
    const saving = product.compareAtPrice
      ? product.compareAtPrice - product.price
      : 0;
    const content = (
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          "group relative flex size-full flex-col justify-between overflow-hidden rounded-md p-3 transition-transform duration-300 hover:z-10 hover:rotate-0 hover:scale-[1.02] active:scale-[0.98] md:p-4",
          onPanel ? "bg-background" : tile.tone,
          tile.tilt,
        )}
      >
        <ProductImage
          src={product.imageUrl}
          alt=""
          sizes="(min-width: 768px) 30vw, 90vw"
          priority={first && index === 0}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="relative flex items-start">
          {saving > 0 ? <Badge>Save {formatNaira(saving)}</Badge> : null}
        </div>
        <div className="bg-background/95 relative flex w-fit max-w-full flex-col rounded-md px-4 py-2 shadow-sm">
          <span className="text-h3 truncate font-bold">{product.name}</span>
          <span className="price text-primary font-bold">
            {formatNaira(product.price)}
          </span>
        </div>
      </Link>
    );
    const slot = cn(
      "min-w-0",
      tile.slot,
      alone && "col-span-2 md:col-span-2",
      pair && index === 1 && "md:row-span-2",
    );
    return first ? (
      <RevealItem key={product.id} variant="scale" className={slot}>
        {content}
      </RevealItem>
    ) : (
      <div key={product.id} className={slot}>
        {content}
      </div>
    );
  });
  const grid = "grid grid-cols-2 gap-3 md:aspect-[5/4] md:grid-rows-2 md:gap-5";
  return first ? (
    <Stagger trigger="mount" gap="loose" delay={0.2} className={grid}>
      {tiles}
    </Stagger>
  ) : (
    <div className={grid}>{tiles}</div>
  );
}

export function HeroProductsSlide({
  slide,
  whatsappHref,
  first,
}: Readonly<{
  slide: HeroProductsContent;
  whatsappHref: string;
  first: boolean;
}>) {
  const Heading = first ? "h1" : "h2";
  const onPanel = slide.tone !== null;
  return (
    <div
      className={cn(
        "grid w-full content-center items-center gap-6 md:grid-cols-[1.1fr_1fr] md:gap-8",
        onPanel && "rounded-lg px-5 py-6 md:px-10 md:py-8",
        slide.tone !== null && HERO_TONE_CLASS[slide.tone],
      )}
    >
      <div className="flex flex-col gap-4 md:gap-6 md:py-8">
        <Heading
          className={cn(
            "text-display font-extrabold text-balance",
            first && "animate-rise-1",
          )}
        >
          {slide.headline}
        </Heading>
        {slide.subtext ? (
          <p
            className={cn(
              "text-muted-foreground max-w-[34ch] text-lg",
              first && "animate-rise-2",
            )}
          >
            {slide.subtext}
          </p>
        ) : null}
        <div
          className={cn(
            "flex gap-2 md:flex-wrap md:gap-3",
            first && "animate-rise-3",
          )}
        >
          <Button
            size="lg"
            className="max-md:h-11 max-md:px-4"
            nativeButton={false}
            render={<Link href={heroHref(slide.ctaHref, whatsappHref)} />}
          >
            {slide.ctaLabel}
          </Button>
          {slide.ctaHref !== HERO_WHATSAPP_HREF ? (
            <Button
              size="lg"
              variant="outline"
              className="max-md:h-11 max-md:px-4"
              nativeButton={false}
              render={<Link href={whatsappHref} />}
            >
              Ask on WhatsApp
            </Button>
          ) : null}
        </div>
      </div>
      {slide.products.length > 0 ? (
        <Collage products={slide.products} onPanel={onPanel} first={first} />
      ) : null}
    </div>
  );
}
