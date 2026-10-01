import Image from "next/image";
import { PackageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductThumb({
  url,
  size = 44,
  className,
}: Readonly<{
  url: string | null | undefined;
  size?: number;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "bg-tone-1 grid shrink-0 place-items-center overflow-hidden rounded-md",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        <PackageIcon className="text-muted-foreground size-5" />
      )}
    </div>
  );
}
