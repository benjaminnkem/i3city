"use client";

import Image from "next/image";
import { PackageIcon } from "lucide-react";
import { useState } from "react";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: Readonly<{ images: string[]; name: string }>) {
  const [active, setActive] = useState(0);
  const current = images[active];
  const unoptimized = !publicEnv.NEXT_PUBLIC_CDN_URL;
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-tone-1 relative aspect-square overflow-hidden rounded-md">
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            unoptimized={unoptimized}
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground absolute inset-0 grid place-items-center">
            <PackageIcon className="size-1/4" strokeWidth={1.25} />
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === active}
                onClick={() => setActive(index)}
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
