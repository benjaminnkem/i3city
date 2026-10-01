import { Suspense } from "react";
import { ProductsView } from "@/components/admin/products/products-view";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsView />
    </Suspense>
  );
}
