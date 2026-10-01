"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProduct, productKeys } from "@/lib/admin/products";
import { toApiError } from "@/lib/api";
import { ProductForm } from "./product-form";

export function ProductEditor({ productId }: Readonly<{ productId?: string }>) {
  const product = useQuery({
    queryKey: productKeys.detail(productId ?? ""),
    queryFn: () => getProduct(productId ?? ""),
    enabled: productId !== undefined,
  });

  if (productId === undefined) {
    return <ProductForm product={null} />;
  }
  if (product.isError) {
    const error = toApiError(product.error);
    return (
      <Alert>
        <AlertTitle>
          {error.status === 404
            ? "Product not found"
            : "Could not load the product"}
        </AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {error.status === 404 ? "It may have been deleted." : error.message}
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/products" />}
          >
            Back to products
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!product.data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }
  return <ProductForm key={product.data.id} product={product.data} />;
}
