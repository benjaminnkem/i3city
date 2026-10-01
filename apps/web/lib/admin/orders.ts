import type {
  AdminOrder,
  AdminOrderListItem,
  OrderSort,
  OrderStatusName,
  PaginationMeta,
  PaymentStatusName,
} from "@repo/types";
import { adminRequest, adminRequestPage } from "./client";

export interface OrderFilters {
  status: OrderStatusName | "";
  paymentStatus: PaymentStatusName | "";
  search: string;
  sort: OrderSort;
  page: number;
  limit: number;
}

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  status: "",
  paymentStatus: "",
  search: "",
  sort: "newest",
  page: 1,
  limit: 20,
};

export const orderKeys = {
  all: ["admin", "orders"] as const,
  list: (filters: OrderFilters) =>
    ["admin", "orders", "list", filters] as const,
  detail: (id: string) => ["admin", "orders", "detail", id] as const,
};

export function listOrders(
  filters: OrderFilters,
): Promise<{ items: AdminOrderListItem[]; meta: PaginationMeta }> {
  const { status, paymentStatus, search, sort, page, limit } = filters;
  return adminRequestPage<AdminOrderListItem>({
    url: "/admin/orders",
    params: {
      page,
      limit,
      sort,
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(search ? { search } : {}),
    },
  });
}

export function getOrder(id: string): Promise<AdminOrder> {
  return adminRequest<AdminOrder>({ url: `/admin/orders/${id}` });
}

export interface OrderPatch {
  status?: OrderStatusName;
  paymentStatus?: PaymentStatusName;
  courier?: string | null;
  trackingNumber?: string | null;
}

export function updateOrder(
  id: string,
  patch: OrderPatch,
): Promise<AdminOrder> {
  return adminRequest<AdminOrder>({
    method: "patch",
    url: `/admin/orders/${id}`,
    data: patch,
  });
}
