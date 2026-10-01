"use client";

import { formatNaira, stateLabel } from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { customerPhone } from "@/lib/admin/order-templates";
import { getOrder, orderKeys } from "@/lib/admin/orders";
import { getSettings, settingsKeys } from "@/lib/admin/settings";

export function PackingSlip({ orderId }: Readonly<{ orderId: string }>) {
  const order = useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
  });
  const settings = useQuery({
    queryKey: settingsKeys.settings,
    queryFn: getSettings,
  });

  if (!order.data) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        {order.isError ? (
          <p>We could not load this order.</p>
        ) : (
          <Skeleton className="h-96 rounded-md" />
        )}
      </div>
    );
  }
  const data = order.data;
  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <PrinterIcon data-icon="inline-start" />
          Print
        </Button>
      </div>

      <header className="border-foreground mb-6 flex items-start justify-between gap-6 border-b-2 pb-4">
        <div>
          <p className="text-2xl font-extrabold tracking-tight">
            {settings.data?.storeName ?? "i3City"}
          </p>
          {settings.data?.address ? (
            <p className="text-sm">{settings.data.address}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-sm">Packing slip</p>
          <p className="price text-xl font-extrabold">{data.code}</p>
          <p className="price text-sm">
            {format(parseISO(data.createdAt), "d MMM yyyy")}
          </p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-1 text-sm font-bold">Deliver to</h2>
          <p className="font-bold">{data.customerName}</p>
          <p className="price">{customerPhone(data)}</p>
          <p>{data.address}</p>
          <p>
            {data.city}, {stateLabel(data.state)}
          </p>
        </div>
        <div>
          <h2 className="mb-1 text-sm font-bold">Payment</h2>
          <p>{data.paymentStatus === "PAID" ? "Paid" : "Not paid yet"}</p>
          {data.note ? (
            <>
              <h2 className="mt-3 mb-1 text-sm font-bold">Customer note</h2>
              <p>{data.note}</p>
            </>
          ) : null}
        </div>
      </section>

      <table className="mb-6 w-full text-left">
        <thead>
          <tr className="border-foreground border-b">
            <th className="w-10 py-2" aria-label="Packed" />
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.name} className="border-border border-b">
              <td className="py-3">
                <span className="border-foreground inline-block size-4 border" />
              </td>
              <td className="py-3 font-bold">{item.name}</td>
              <td className="price py-3 text-right">{item.quantity}</td>
              <td className="price py-3 text-right">
                {formatNaira(item.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto flex w-64 flex-col gap-1">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="price">{formatNaira(data.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd className="price">
            {data.shippingFee === 0 ? "Free" : formatNaira(data.shippingFee)}
          </dd>
        </div>
        <div className="border-foreground flex justify-between border-t pt-1 text-lg font-extrabold">
          <dt>Total</dt>
          <dd className="price">{formatNaira(data.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
