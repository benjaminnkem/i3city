"use client";

import {
  ORDER_TRANSITIONS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type AdminOrder,
  type OrderStatusName,
  type PaymentStatusName,
} from "@repo/types";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OrderPatch } from "@/lib/admin/orders";
import { OrderStatusBadge, PaymentStatusBadge } from "./status-badge";

const NEXT_STEP: Partial<
  Record<OrderStatusName, { status: OrderStatusName; label: string }>
> = {
  PENDING_PAYMENT: { status: "CONFIRMED", label: "Confirm order" },
  AWAITING_CONFIRMATION: { status: "CONFIRMED", label: "Confirm order" },
  CONFIRMED: { status: "PACKED", label: "Mark as packed" },
  PACKED: { status: "SHIPPED", label: "Mark as shipped" },
  SHIPPED: { status: "DELIVERED", label: "Mark as delivered" },
};

export function OrderStatusCard({
  order,
  pending,
  onChange,
}: Readonly<{
  order: AdminOrder;
  pending: boolean;
  onChange: (patch: OrderPatch) => void;
}>) {
  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const waitingForPayment =
    order.status === "PENDING_PAYMENT" && order.paymentStatus !== "PAID";
  const next = waitingForPayment ? undefined : NEXT_STEP[order.status];
  const canCancel = ORDER_TRANSITIONS[order.status].includes("CANCELLED");

  function advance() {
    if (!next) return;
    if (next.status === "SHIPPED") {
      setShipOpen(true);
      return;
    }
    onChange({ status: next.status });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {next ? (
          <Button size="lg" disabled={pending} onClick={advance}>
            {next.label}
          </Button>
        ) : (
          <p className="text-muted-foreground">
            {waitingForPayment
              ? "Waiting for the customer to pay. It confirms automatically when payment arrives, or cancels when the payment window ends."
              : order.status === "DELIVERED"
                ? "This order is complete."
                : "This order was cancelled."}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">Payment</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_STATUSES.filter(
              (status) => status !== order.paymentStatus,
            ).map((status: PaymentStatusName) => (
              <Button
                key={status}
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => onChange({ paymentStatus: status })}
              >
                Mark as {PAYMENT_STATUS_LABELS[status].toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {canCancel ? (
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => setCancelOpen(true)}
          >
            Cancel order
          </Button>
        ) : null}
      </CardContent>

      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              onChange({
                status: "SHIPPED",
                courier: courier.trim() || null,
                trackingNumber: tracking.trim() || null,
              });
              setShipOpen(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Mark as shipped</DialogTitle>
              <DialogDescription>
                Add the courier details. The customer sees them when they track
                the order
                {order.email ? " and gets an email" : ""}.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="courier">Courier</FieldLabel>
              <Input
                id="courier"
                value={courier}
                onChange={(event) => setCourier(event.target.value)}
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tracking">Tracking number</FieldLabel>
              <Input
                id="tracking"
                value={tracking}
                onChange={(event) => setTracking(event.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShipOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Mark as shipped</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order {order.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              The items go back into stock. If the customer already paid, mark
              the payment as refunded after you return their money.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                onChange({ status: "CANCELLED" });
                setCancelOpen(false);
              }}
            >
              Cancel order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
