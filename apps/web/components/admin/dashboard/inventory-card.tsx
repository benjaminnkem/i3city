import { formatNaira, type ProductStats } from "@repo/types";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function Row({
  label,
  value,
  total,
  href,
}: Readonly<{ label: string; value: number; total: number; href?: string }>) {
  const content = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="price font-bold">{value}</span>
      </div>
      <Progress value={total === 0 ? 0 : (value / total) * 100} />
    </div>
  );
  return href ? (
    <Link href={href} className="hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

export function InventoryCard({
  products,
}: Readonly<{ products: ProductStats }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
        <CardDescription>
          <span className="price font-bold text-foreground">
            {formatNaira(products.inventoryValue)}
          </span>{" "}
          of stock on hand
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Row
          label="Visible in store"
          value={products.active}
          total={products.total}
          href="/admin/products?status=active"
        />
        <Row
          label="Hidden"
          value={products.inactive}
          total={products.total}
          href="/admin/products?status=inactive"
        />
        <Row
          label="Low stock"
          value={products.lowStock}
          total={products.total}
          href="/admin/products?stock=low"
        />
        <Row
          label="Out of stock"
          value={products.outOfStock}
          total={products.total}
          href="/admin/products?stock=out"
        />
      </CardContent>
    </Card>
  );
}
