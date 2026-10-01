import { LOW_STOCK_THRESHOLD, type LowStockItem } from "@repo/types";
import Image from "next/image";
import Link from "next/link";
import { PackageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LowStockCard({ items }: Readonly<{ items: LowStockItem[] }>) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Needs restocking</CardTitle>
        <CardDescription>
          Visible products with {LOW_STOCK_THRESHOLD} or fewer left
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            Everything is well stocked.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="bg-tone-1 relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-md">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <PackageIcon className="text-muted-foreground size-5" />
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate font-bold">
                  {item.name}
                </span>
                <Badge
                  variant="outline"
                  className={item.stock === 0 ? "" : "text-warning"}
                >
                  {item.stock === 0 ? "Out of stock" : `${item.stock} left`}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/admin/products/${item.id}`} />}
                >
                  Update
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
