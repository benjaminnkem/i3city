import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatusName,
  type PaymentStatusName,
} from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<OrderStatusName, string> = {
  PENDING_PAYMENT: "text-muted-foreground",
  AWAITING_CONFIRMATION: "text-warning",
  CONFIRMED: "text-primary",
  PACKED: "text-primary",
  SHIPPED: "text-primary",
  DELIVERED: "text-success",
  CANCELLED: "text-destructive",
};

const PAYMENT_CLASS: Record<PaymentStatusName, string> = {
  UNPAID: "text-warning",
  PAID: "text-success",
  FAILED: "text-destructive",
  REFUNDED: "text-muted-foreground",
};

export function OrderStatusBadge({
  status,
}: Readonly<{ status: OrderStatusName }>) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASS[status])}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({
  status,
}: Readonly<{ status: PaymentStatusName }>) {
  return (
    <Badge variant="outline" className={cn(PAYMENT_CLASS[status])}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
