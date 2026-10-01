"use client";

import { formatNaira } from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  BanknoteIcon,
  BellRingIcon,
  PlusIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  TagsIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getStats, statsKeys } from "@/lib/admin/stats";
import { toApiError } from "@/lib/api";
import { CategoryCard } from "./category-card";
import { percentChange } from "./dashboard-format";
import { InventoryCard } from "./inventory-card";
import { KpiCard } from "./kpi-card";
import { LowStockCard } from "./low-stock-card";
import { OrderStatusCard } from "./order-status-card";
import { RevenueChartCard } from "./revenue-chart-card";
import { TopProductsCard } from "./top-products-card";

const REFRESH_INTERVAL_MS = 60_000;

type Range = "7" | "30";

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-md" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-md lg:col-span-2" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const [range, setRange] = useState<Range>("7");
  const query = useQuery({
    queryKey: statsKeys.all,
    queryFn: getStats,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  const stats = query.data;
  const days = Number(range);

  const period = useMemo(() => {
    if (!stats) return null;
    const points = stats.revenueSeries.slice(-days);
    const revenue = sum(points.map((point) => point.revenue));
    const orders = sum(points.map((point) => point.orders));
    const previous =
      days === 7 ? stats.orders.revenuePrev7d : stats.orders.revenuePrev30d;
    return {
      points,
      revenue,
      orders,
      change: percentChange(revenue, previous),
      average: orders === 0 ? 0 : Math.round(revenue / orders),
    };
  }, [stats, days]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          stats
            ? `Updated ${formatDistanceToNow(parseISO(stats.generatedAt), { addSuffix: true })}`
            : "Your store at a glance"
        }
        actions={
          <>
            <ToggleGroup
              variant="outline"
              value={[range]}
              onValueChange={(value) => {
                const next = value[0];
                if (next === "7" || next === "30") setRange(next);
              }}
              aria-label="Date range"
            >
              <ToggleGroupItem value="7">7 days</ToggleGroupItem>
              <ToggleGroupItem value="30">30 days</ToggleGroupItem>
            </ToggleGroup>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              disabled={query.isFetching}
              onClick={() => query.refetch()}
            >
              <RefreshCwIcon
                className={query.isFetching ? "animate-spin" : ""}
              />
            </Button>
          </>
        }
      />

      {query.isError ? (
        <Alert>
          <AlertTitle>Could not load the dashboard</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(query.error).message}
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : !stats || !period ? (
        <DashboardSkeleton />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title={`Revenue, ${days} days`}
              value={formatNaira(period.revenue)}
              change={period.change}
              hint={`vs previous ${days} days`}
              icon={<BanknoteIcon className="size-4" />}
            />
            <KpiCard
              title={`Paid orders, ${days} days`}
              value={String(period.orders)}
              hint={`${stats.orders.today} placed today`}
              icon={<ReceiptTextIcon className="size-4" />}
            />
            <KpiCard
              title="Average order value"
              value={formatNaira(period.average)}
              hint={`last ${days} days`}
              icon={<WalletCardsIcon className="size-4" />}
            />
            <KpiCard
              title="Awaiting your action"
              value={String(stats.orders.awaitingAction)}
              tone={stats.orders.awaitingAction > 0 ? "warning" : "default"}
              hint="orders to confirm"
              icon={<BellRingIcon className="size-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <RevenueChartCard points={period.points} days={days} />
            <OrderStatusCard statuses={stats.orderStatus} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TopProductsCard products={stats.topProducts} />
            <CategoryCard categories={stats.categories} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <LowStockCard items={stats.lowStock} />
            <div className="flex flex-col gap-4">
              <InventoryCard products={stats.products} />
              <Card>
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    nativeButton={false}
                    render={<Link href="/admin/products/new" />}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Add product
                  </Button>
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/admin/categories" />}
                  >
                    <TagsIcon data-icon="inline-start" />
                    Categories
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
