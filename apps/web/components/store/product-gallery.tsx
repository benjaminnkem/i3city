"use client";

import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, PackageIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: Readonly<{ images: string[]; name: string }>) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const unoptimized = !publicEnv.NEXT_PUBLIC_CDN_URL;
  const multiple = images.length > 1;

  const goTo = useCallback((index: number) => {
    const element = track.current;
    if (!element) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  function onScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const index = Math.round(element.scrollLeft / element.clientWidth);
    setActive((current) => (current === index ? current : index));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-tone-1 relative aspect-square overflow-hidden rounded-md">
        {images.length > 0 ? (
          <div
            ref={track}
            onScroll={onScroll}
            role="group"
            aria-roledescription="carousel"
            aria-label={`${name} photos`}
            className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((image, index) => (
              <div
                key={image}
                role="group"
                aria-roledescription="slide"
                aria-label={`Photo ${index + 1} of ${images.length}`}
                className="relative size-full shrink-0 snap-center snap-always"
              >
                <Image
                  src={image}
                  alt={index === 0 ? name : `${name}, photo ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  unoptimized={unoptimized}
                  draggable={false}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground absolute inset-0 grid place-items-center">
            <PackageIcon className="size-1/4" strokeWidth={1.25} />
          </div>
        )}
        {multiple ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Previous photo"
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
              className="absolute top-1/2 left-3 hidden -translate-y-1/2 md:inline-flex"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Next photo"
              disabled={active === images.length - 1}
              onClick={() => goTo(active + 1)}
              className="absolute top-1/2 right-3 hidden -translate-y-1/2 md:inline-flex"
            >
              <ChevronRightIcon />
            </Button>
            <p className="bg-background/90 price text-small absolute right-3 bottom-3 rounded-pill px-3 py-1 font-bold backdrop-blur">
              {active + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>
      {multiple ? (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={cn(
                  "bg-tone-1 relative block aspect-square w-full overflow-hidden rounded-sm border-2 border-transparent",
                  index === active && "border-primary",
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="96px"
                  unoptimized={unoptimized}
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
