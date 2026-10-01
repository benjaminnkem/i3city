import { PackingSlip } from "@/components/admin/orders/packing-slip";

export const metadata = { title: "Packing slip", robots: { index: false } };

export default async function PackingSlipPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <PackingSlip orderId={id} />;
}
