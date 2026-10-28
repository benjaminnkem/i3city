import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatNaira,
  stateLabel,
} from "@repo/types";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderTimeline } from "@/components/store/order-timeline";
import { ProductImage } from "@/components/store/product-image";
import { Container } from "@/components/store/section";
import { PayOnlineButton } from "@/components/store/payment-actions";
import { PaymentCountdown } from "@/components/store/payment-countdown";
import { VerifyPayment } from "@/components/store/verify-payment";
import { WhatsAppContinue } from "@/components/store/whatsapp-continue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchOrderChecked, fetchSettings } from "@/lib/store/api";
import { whatsappLink } from "@/lib/store/whatsapp";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return {
    title: `Order ${code.toUpperCase()}`,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { code } = await params;
  const query = await searchParams;
  const placed = query.placed === "1";
  const reference = [query.reference, query.trxref]
    .flat()
    .find((value): value is string => typeof value === "string");
  const [order, settings] = await Promise.all([
    fetchOrderChecked(code, reference),
    fetchSettings(),
  ]);
  if (!order) notFound();

  const awaitingPayment =
    order.status === "PENDING_PAYMENT" && order.paymentStatus !== "PAID";
  const verifying = order.paymentStatus !== "PAID" && reference !== undefined;
  const justPaid =
    order.paymentStatus === "PAID" &&
    (query.paid === "1" || reference !== undefined);
  const expired =
    order.status === "CANCELLED" &&
    order.paymentMethod === "PAYSTACK" &&
    order.paymentStatus !== "PAID";

  const help = whatsappLink(
    settings.whatsappNumber,
    `Hello, I have a question about order ${order.code}.`,
  );

  return (
    <Container className="max-w-3xl py-8">
      {verifying ? (
        <div className="mb-8">
          <VerifyPayment code={order.code} reference={reference} />
        </div>
      ) : null}

      {justPaid ? (
        <div className="bg-tone-3 mb-8 flex items-start gap-3 rounded-lg p-6">
          <CheckCircle2Icon className="text-success mt-1 size-7 shrink-0" />
          <div>
            <h1 className="text-h2 font-extrabold">
              Payment received, thank you
            </h1>
            <p className="text-muted-foreground">
              Your order is confirmed and we are getting it ready. You can
              follow it on this page.
            </p>
          </div>
        </div>
      ) : null}

      {awaitingPayment && order.canPayOnline && !verifying ? (
        <div className="bg-tone-4 mb-8 flex flex-col gap-4 rounded-lg p-6">
          <h1 className="text-h2 font-extrabold">Complete your payment</h1>
          {order.paymentExpiresAt ? (
            <PaymentCountdown expiresAt={order.paymentExpiresAt} />
          ) : null}
          <PayOnlineButton code={order.code} label="Pay now" />
        </div>
      ) : null}

      {expired ? (
        <div className="bg-muted mb-8 flex flex-col gap-3 rounded-lg p-6">
          <h1 className="text-h2 font-extrabold">This order expired</h1>
          <p className="text-muted-foreground">
            We did not receive payment in time, so we released the items. If you
            have paid, message us on WhatsApp and we will sort it out.
          </p>
        </div>
      ) : null}

      {placed && !awaitingPayment ? (
        <div className="bg-tone-1 mb-8 flex flex-col gap-4 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2Icon className="text-success mt-1 size-7 shrink-0" />
            <div>
              <h1 className="text-h2 font-extrabold">
                Thank you, your order is in
              </h1>
              <p className="text-muted-foreground">
                Send it to us on WhatsApp so we can confirm stock and share
                payment details.
              </p>
            </div>
          </div>
          <WhatsAppContinue code={order.code} autoOpen />
        </div>
      ) : !awaitingPayment && !justPaid && !expired ? (
        <h1 className="text-h2 mb-6 font-extrabold">Order {order.code}</h1>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground">Order code</span>
        <span className="price text-lg font-extrabold">{order.code}</span>
        <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
        <Badge variant="outline">
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section
          aria-labelledby="progress"
          className="border-border rounded-lg border p-6"
        >
          <h2 id="progress" className="mb-4 text-lg font-extrabold">
            Progress
          </h2>
          <OrderTimeline timeline={order.timeline} status={order.status} />
          {order.courier || order.trackingNumber ? (
            <dl className="border-border mt-6 flex flex-col gap-1 border-t pt-4">
              {order.courier ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Courier</dt>
                  <dd className="font-bold">{order.courier}</dd>
                </div>
              ) : null}
              {order.trackingNumber ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Tracking number</dt>
                  <dd className="price font-bold">{order.trackingNumber}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </section>

        <section
          aria-labelledby="items"
          className="border-border rounded-lg border p-6"
        >
          <h2 id="items" className="mb-4 text-lg font-extrabold">
            Items
          </h2>
          <ul className="flex flex-col gap-4">
            {order.items.map((item) => (
              <li key={item.name} className="flex items-center gap-3">
                <span className="bg-tone-1 relative size-14 shrink-0 overflow-hidden rounded-sm">
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    sizes="56px"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{item.name}</span>
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
          <dl className="border-border mt-4 flex flex-col gap-1.5 border-t pt-4">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="price">{formatNaira(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Delivery to {stateLabel(order.state)}
              </dt>
              <dd className="price">
                {order.shippingFee === 0
                  ? "Free"
                  : formatNaira(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between text-lg">
              <dt className="font-extrabold">Total</dt>
              <dd className="price text-primary font-extrabold">
                {formatNaira(order.total)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {!placed && order.paymentMethod === "WHATSAPP" ? (
          <WhatsAppContinue code={order.code} autoOpen={false} />
        ) : null}
        {order.canPayOnline &&
        order.paymentMethod === "WHATSAPP" &&
        !awaitingPayment ? (
          <PayOnlineButton code={order.code} variant="outline" />
        ) : null}
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href={help} />}
        >
          Ask about this order
        </Button>
        <Button
          variant="ghost"
          size="lg"
          nativeButton={false}
          render={<Link href="/shop" />}
        >
          Keep shopping
        </Button>
      </div>
    </Container>
  );
}
