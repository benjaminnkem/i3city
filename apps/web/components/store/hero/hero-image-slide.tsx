import type { PublicHeroSlide } from "@repo/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HERO_TONE_CLASS, heroHref } from "./hero-link";

export function HeroImageSlide({
  slide,
  whatsappHref,
  first,
}: Readonly<{
  slide: PublicHeroSlide;
  whatsappHref: string;
  first: boolean;
}>) {
  const Heading = first ? "h1" : "h2";
  return (
    <div
      className={cn(
        "relative flex aspect-[4/5] w-full items-end overflow-hidden rounded-lg sm:aspect-[16/9] md:aspect-[12/5]",
        HERO_TONE_CLASS[slide.tone ?? 1],
      )}
    >
      {slide.imageUrl ? (
        <Image
          src={slide.imageUrl}
          alt={slide.imageAlt}
          fill
          priority={first}
          sizes="(min-width: 1240px) 1240px, 100vw"
          className="object-cover"
        />
      ) : null}
      <div
        className={cn(
          "bg-background/95 relative m-3 flex max-w-md flex-col items-start gap-3 rounded-md p-4 shadow-sm backdrop-blur md:m-8 md:gap-4 md:p-6",
          first && "animate-rise-1",
        )}
      >
        <Heading className="text-h2 font-extrabold text-balance">
          {slide.headline}
        </Heading>
        {slide.subtext ? (
          <p className="text-muted-foreground">{slide.subtext}</p>
        ) : null}
        <Button
          nativeButton={false}
          render={<Link href={heroHref(slide.ctaHref, whatsappHref)} />}
        >
          {slide.ctaLabel}
        </Button>
      </div>
    </div>
  );
}
