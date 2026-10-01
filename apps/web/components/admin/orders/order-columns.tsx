"use client";

import {
  formatNaira,
  formatNigerianPhone,
  stateLabel,
  type AdminOrderListItem,
} from "@repo/types";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import Link from "next/link";
import { OrderStatusBadge, PaymentStatusBadge } from "./status-badge";

export const orderColumns: ColumnDef<AdminOrderListItem>[] = [
  {
    accessorKey: "code",
    header: "Order",
    cell: ({ row }) => (
      <Link
        href={`/admin/orders/${row.original.id}`}
        className="price font-extrabold hover:underline"
      >
        {row.original.code}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex min-w-40 flex-col">
        <span className="font-bold">{row.original.customerName}</span>
        <span className="text-muted-foreground price text-sm">
          {formatNigerianPhone(row.original.phone)}
        </span>
      </div>
    ),
  },
  {
    id: "state",
    header: "Delivery",
    meta: { className: "hidden md:table-cell" },
    cell: ({ row }) => stateLabel(row.original.state),
  },
  {
    id: "items",
    header: "Items",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => <span className="price">{row.original.itemCount}</span>,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="price font-extrabold text-primary">
        {formatNaira(row.original.total)}
      </span>
    ),
  },
  {
    id: "payment",
    header: "Payment",
    cell: ({ row }) => (
      <PaymentStatusBadge status={row.original.paymentStatus} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    id: "placed",
    header: "Placed",
    meta: { className: "text-muted-foreground hidden xl:table-cell" },
    cell: ({ row }) => (
      <span
        title={format(parseISO(row.original.createdAt), "d MMM yyyy, h:mm a")}
      >
        {formatDistanceToNow(parseISO(row.original.createdAt), {
          addSuffix: true,
        })}
      </span>
    ),
  },
];
