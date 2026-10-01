import type {
  AdminOrder,
  AdminOrderListItem,
  OrderLine,
  OrderTimelineEntry,
  PublicOrder,
} from "@repo/types";
import type { Prisma } from "../generated/prisma/client.js";
import type { StorageService } from "../storage/storage.service.js";

export const ORDER_INCLUDE = {
  items: true,
  events: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

export type OrderRow = Prisma.OrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

function lines(row: OrderRow, storage: StorageService): OrderLine[] {
  return row.items.map((item) => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.image ? storage.publicUrl(item.image) : null,
  }));
}

function timeline(row: OrderRow): OrderTimelineEntry[] {
  if (row.events.length === 0) {
    return [{ status: row.status, at: row.createdAt.toISOString() }];
  }
  return row.events.map((event) => ({
    status: event.status,
    at: event.createdAt.toISOString(),
  }));
}

export function toPublicOrder(
  row: OrderRow,
  storage: StorageService,
): PublicOrder {
  return {
    code: row.code,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    createdAt: row.createdAt.toISOString(),
    items: lines(row, storage),
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    total: row.total,
    state: row.state,
    courier: row.courier,
    trackingNumber: row.trackingNumber,
    timeline: timeline(row),
  };
}

export function toListItem(
  row: Prisma.OrderGetPayload<{
    include: { items: { select: { quantity: true } } };
  }>,
): AdminOrderListItem {
  return {
    id: row.id,
    code: row.code,
    customerName: row.customerName,
    phone: row.phone,
    state: row.state,
    itemCount: row.items.reduce((total, item) => total + item.quantity, 0),
    total: row.total,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminOrder(
  row: OrderRow,
  storage: StorageService,
): AdminOrder {
  return {
    ...toListItem(row),
    email: row.email,
    address: row.address,
    city: row.city,
    note: row.note,
    items: lines(row, storage),
    subtotal: row.subtotal,
    shippingFee: row.shippingFee,
    courier: row.courier,
    trackingNumber: row.trackingNumber,
    paidAt: row.paidAt?.toISOString() ?? null,
    timeline: timeline(row),
  };
}
