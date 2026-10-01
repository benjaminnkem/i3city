import type { OrderStatusName } from "./stats.js";

export const PAYMENT_METHODS = ["WHATSAPP", "PAYSTACK"] as const;
export type PaymentMethodName = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;
export type PaymentStatusName = (typeof PAYMENT_STATUSES)[number];

export const ORDER_TRANSITIONS: Record<
  OrderStatusName,
  readonly OrderStatusName[]
> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  AWAITING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatusName, string> = {
  PENDING_PAYMENT: "Pending payment",
  AWAITING_CONFIRMATION: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusName, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export interface OrderLine {
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

export interface OrderTimelineEntry {
  status: OrderStatusName;
  at: string;
}

export const PAYMENT_WINDOW_MINUTES = 30;

export interface PublicOrder {
  code: string;
  status: OrderStatusName;
  paymentStatus: PaymentStatusName;
  paymentMethod: PaymentMethodName;
  createdAt: string;
  items: OrderLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  state: string;
  courier: string | null;
  trackingNumber: string | null;
  timeline: OrderTimelineEntry[];
  paymentExpiresAt: string | null;
  canPayOnline: boolean;
}

export interface CreateOrderResult {
  order: PublicOrder;
  whatsappUrl: string | null;
  authorizationUrl: string | null;
}

export interface PaymentLink {
  authorizationUrl: string;
}

export interface AdminOrderListItem {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  state: string;
  itemCount: number;
  total: number;
  status: OrderStatusName;
  paymentStatus: PaymentStatusName;
  paymentMethod: PaymentMethodName;
  createdAt: string;
}

export interface AdminOrder extends AdminOrderListItem {
  email: string | null;
  address: string;
  city: string;
  note: string | null;
  items: OrderLine[];
  subtotal: number;
  shippingFee: number;
  courier: string | null;
  trackingNumber: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  paystackRef: string | null;
  timeline: OrderTimelineEntry[];
}

export const ORDER_SORTS = ["newest", "oldest", "total-desc"] as const;
export type OrderSort = (typeof ORDER_SORTS)[number];
