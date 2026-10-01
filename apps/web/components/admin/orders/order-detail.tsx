"use client";

import {
  ORDER_STATUS_LABELS,
  formatNaira,
  stateLabel,
  type AdminOrder,
} from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  ArrowLeftIcon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  PrinterIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { ProductThumb } from "@/components/admin/products/product-thumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { notifyError } from "@/lib/admin/errors";
import { customerPhone, whatsappToCustomer } from "@/lib/admin/order-templates";
import {
  getOrder,
  orderKeys,
  updateOrder,
  type OrderPatch,
} from "@/lib/admin/orders";
import { getSettings, settingsKeys } from "@/lib/admin/settings";
import { statsKeys } from "@/lib/admin/stats";
import { productKeys } from "@/lib/admin/products";
import { toApiError } from "@/lib/api";
import { OrderMessagesCard } from "./order-messages-card";
import { OrderStatusCard } from "./order-status-card";
import { OrderStatusBadge } from "./status-badge";

function Detail({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function CourierCard({
  order,
  pending,
  onSave,
}: Readonly<{
  order: AdminOrder;
  pending: boolean;
  onSave: (patch: OrderPatch) => void;
}>) {
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Courier and tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave({
              courier: courier.trim() || null,
              trackingNumber: tracking.trim() || null,
            });
          }}
        >
          <Field>
            <FieldLabel htmlFor="courier-name">Courier</FieldLabel>
            <Input
              id="courier-name"
              value={courier}
              onChange={(event) => setCourier(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tracking-number">Tracking number</FieldLabel>
            <Input
              id="tracking-number"
              value={tracking}
              onChange={(event) => setTracking(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="outline" disabled={pending}>
            Save details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function OrderDetail({ orderId }: Readonly<{ orderId: string }>) {
  const queryClient = useQueryClient();
  const order = useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
  });
  const settings = useQuery({
    queryKey: settingsKeys.settings,
    queryFn: getSettings,
  });

  const update = useMutation({
    mutationFn: (patch: OrderPatch) => updateOrder(orderId, patch),
    onSuccess: async (saved, patch) => {
      queryClient.setQueryData(orderKeys.detail(orderId), saved);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        queryClient.invalidateQueries({ queryKey: statsKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
      ]);
      toast.success(
        patch.status
          ? `Order ${ORDER_STATUS_LABELS[patch.status].toLowerCase()}`
          : patch.paymentStatus
            ? "Payment updated"
            : "Details saved",
      );
    },
    onError: notifyError,
  });

  if (order.isError) {
    const error = toApiError(order.error);
    return (
      <Alert>
        <AlertTitle>
          {error.status === 404
            ? "Order not found"
            : "Could not load the order"}
        </AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {error.status === 404 ? "It may have been removed." : error.message}
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/orders" />}
          >
            Back to orders
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!order.data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  const data = order.data;
  const hello = `Hello ${data.customerName}, this is about your order ${data.code}.`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 w-fit"
          nativeButton={false}
          render={<Link href="/admin/orders" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Orders
        </Button>
        <PageHeader
          title={`Order ${data.code}`}
          description={`Placed ${format(parseISO(data.createdAt), "d MMM yyyy, h:mm a")}`}
          actions={
            <>
              <OrderStatusBadge status={data.status} />
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={`/admin/print/orders/${data.id}`}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <PrinterIcon data-icon="inline-start" />
                Packing slip
              </Button>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-border divide-y">
                {data.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center gap-3 py-3 first:pt-0"
                  >
                    <ProductThumb url={item.imageUrl} size={48} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">
                        {item.name}
                      </span>
                      <span className="price text-muted-foreground text-sm">
                        {item.quantity} × {formatNaira(item.price)}
                      </span>
                    </span>
                    <span className="price font-bold">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="border-border mt-2 flex flex-col gap-1.5 border-t pt-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="price">{formatNaira(data.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Delivery to {stateLabel(data.state)}
                  </dt>
                  <dd className="price">
                    {data.shippingFee === 0
                      ? "Free"
                      : formatNaira(data.shippingFee)}
                  </dd>
                </div>
                <div className="flex justify-between text-lg">
                  <dt className="font-extrabold">Total</dt>
                  <dd className="price text-primary font-extrabold">
                    {formatNaira(data.total)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Name">{data.customerName}</Detail>
                <Detail label="Phone">
                  <span className="price">{customerPhone(data)}</span>
                </Detail>
                {data.email ? (
                  <Detail label="Email">{data.email}</Detail>
                ) : null}
                <Detail label="Payment method">
                  {data.paymentMethod === "PAYSTACK"
                    ? "Card or transfer (Paystack)"
                    : "Arranged on WhatsApp"}
                </Detail>
                {data.paystackRef ? (
                  <Detail label="Paystack reference">
                    <span className="price">{data.paystackRef}</span>
                  </Detail>
                ) : null}
                {data.status === "PENDING_PAYMENT" && data.expiresAt ? (
                  <Detail label="Payment window ends">
                    {format(parseISO(data.expiresAt), "d MMM yyyy, h:mm a")}
                  </Detail>
                ) : null}
                <Detail label="Delivery address">
                  {data.address}, {data.city}, {stateLabel(data.state)}
                </Detail>
                {data.note ? (
                  <Detail label="Customer note">{data.note}</Detail>
                ) : null}
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<a href={`tel:+${data.phone}`} />}
                >
                  <PhoneIcon data-icon="inline-start" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={whatsappToCustomer(data.phone, hello)}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <MessageCircleIcon data-icon="inline-start" />
                  WhatsApp
                </Button>
                {data.email ? (
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<a href={`mailto:${data.email}`} />}
                  >
                    <MailIcon data-icon="inline-start" />
                    Email
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <OrderMessagesCard order={data} settings={settings.data} />
        </div>

        <div className="flex flex-col gap-6">
          <OrderStatusCard
            order={data}
            pending={update.isPending}
            onChange={(patch) => update.mutate(patch)}
          />
          <CourierCard
            key={`${data.courier}-${data.trackingNumber}`}
            order={data}
            pending={update.isPending}
            onSave={(patch) => update.mutate(patch)}
          />
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {[...data.timeline].reverse().map((entry) => (
                  <li
                    key={`${entry.status}-${entry.at}`}
                    className="flex flex-col"
                  >
                    <span className="font-bold">
                      {ORDER_STATUS_LABELS[entry.status]}
                    </span>
                    <span className="text-muted-foreground price text-sm">
                      {format(parseISO(entry.at), "d MMM yyyy, h:mm a")}
                    </span>
                  </li>
                ))}
              </ol>
              {data.paidAt ? (
                <p className="text-muted-foreground price border-border mt-4 border-t pt-3 text-sm">
                  Paid {format(parseISO(data.paidAt), "d MMM yyyy, h:mm a")}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
