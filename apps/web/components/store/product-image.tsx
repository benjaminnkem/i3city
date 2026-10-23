import Image from "next/image";
import { PackageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: Readonly<{
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}>) {
  if (!src) {
    return (
      <div
        className={cn(
          "text-muted-foreground absolute inset-0 grid place-items-center",
          className,
        )}
      >
        <PackageIcon className="size-1/4" strokeWidth={1.25} />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
