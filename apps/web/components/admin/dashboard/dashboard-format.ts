import type { OrderStatusName } from "@repo/types";

export const STATUS_LABELS: Record<OrderStatusName, string> = {
  PENDING_PAYMENT: "Pending payment",
  AWAITING_CONFIRMATION: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatusName, string> = {
  PENDING_PAYMENT: "var(--muted-foreground)",
  AWAITING_CONFIRMATION: "var(--warning)",
  CONFIRMED: "var(--chart-1)",
  PACKED: "var(--chart-4)",
  SHIPPED: "var(--chart-5)",
  DELIVERED: "var(--success)",
  CANCELLED: "var(--destructive)",
};

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}
