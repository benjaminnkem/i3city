import { OrderDetail } from "@/components/admin/orders/order-detail";

export const metadata = { title: "Order" };

export default async function OrderPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
