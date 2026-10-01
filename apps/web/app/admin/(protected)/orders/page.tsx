import { Suspense } from "react";
import { OrdersView } from "@/components/admin/orders/orders-view";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
