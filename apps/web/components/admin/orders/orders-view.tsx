"use client";

import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type PaymentStatusName,
} from "@repo/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrderFilters } from "@/hooks/use-order-filters";
import {
  DEFAULT_ORDER_FILTERS,
  listOrders,
  orderKeys,
} from "@/lib/admin/orders";
import { toApiError } from "@/lib/api";
import { orderColumns } from "./order-columns";

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_TABS = [
  { value: "all", label: "All" },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

const PAYMENT_ITEMS = [
  { value: "all", label: "Any payment" },
  ...PAYMENT_STATUSES.map((status) => ({
    value: status,
    label: PAYMENT_STATUS_LABELS[status],
  })),
];

export function OrdersView() {
  const [filters, setFilters] = useOrderFilters();
  const [searchDraft, setSearchDraft] = useState(filters.search);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (searchDraft === filters.search) return;
    const timer = setTimeout(
      () => setFilters({ search: searchDraft.trim() }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchDraft, filters.search, setFilters]);

  const orders = useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => listOrders(filters),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const filtered = Boolean(
    filters.status || filters.paymentStatus || filters.search,
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description="Confirm, pack and ship what customers have ordered."
      />

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="Order status"
      >
        {STATUS_TABS.map((tab) => {
          const active = (filters.status || "all") === tab.value;
          return (
            <Button
              key={tab.value}
              role="tab"
              aria-selected={active}
              size="sm"
              variant={active ? "default" : "outline"}
              className="shrink-0"
              onClick={() =>
                setFilters({
                  status:
                    tab.value === "all"
                      ? ""
                      : (tab.value as typeof filters.status),
                })
              }
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <InputGroup className="lg:max-w-sm">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search code, name or phone"
            aria-label="Search orders"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </InputGroup>
        <Select
          items={PAYMENT_ITEMS}
          value={filters.paymentStatus || "all"}
          onValueChange={(value) =>
            setFilters({
              paymentStatus:
                value === "all" || value === null
                  ? ""
                  : (value as PaymentStatusName),
            })
          }
        >
          <SelectTrigger aria-label="Payment status" className="w-full lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchDraft("");
              setFilters({ ...DEFAULT_ORDER_FILTERS });
            }}
          >
            <XIcon data-icon="inline-start" />
            Clear filters
          </Button>
        ) : null}
      </div>

      {orders.isError ? (
        <Alert>
          <AlertTitle>Could not load orders</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(orders.error).message}
            <Button
              size="sm"
              variant="outline"
              onClick={() => orders.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          columns={orderColumns}
          data={orders.data?.items ?? []}
          getRowId={(order) => order.id}
          loading={orders.isPending}
          pagination={{
            page: orders.data?.meta.page ?? filters.page,
            pageSize: orders.data?.meta.limit ?? filters.limit,
            total: orders.data?.meta.total ?? 0,
            onPageChange: (page) => setFilters({ page }),
          }}
          emptyTitle={filtered ? "No orders match" : "No orders yet"}
          emptyDescription={
            filtered
              ? "Try a different search or clear the filters."
              : "Orders appear here as soon as customers place them."
          }
        />
      )}
    </>
  );
}
