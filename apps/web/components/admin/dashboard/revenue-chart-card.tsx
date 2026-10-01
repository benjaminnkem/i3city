"use client";

import type { RevenuePoint } from "@repo/types";
import { formatNaira } from "@repo/types";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Paid orders", color: "var(--chart-1)" },
} satisfies ChartConfig;

type Metric = "revenue" | "orders";

function shortNaira(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `₦${Math.round(value / 1_000)}k`;
  return `₦${value}`;
}

export function RevenueChartCard({
  points,
  days,
}: Readonly<{ points: RevenuePoint[]; days: number }>) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const dateTick = (value: string) => format(parseISO(value), "d MMM");
  const common = {
    data: points,
    margin: { left: 4, right: 8, top: 8 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
        tickFormatter={dateTick}
      />
      <YAxis
        width={metric === "revenue" ? 48 : 28}
        tickLine={false}
        axisLine={false}
        allowDecimals={false}
        tickFormatter={metric === "revenue" ? shortNaira : undefined}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            labelFormatter={(value) =>
              format(parseISO(String(value)), "EEE d MMM")
            }
            formatter={(value, name) => (
              <div className="flex w-full items-center justify-between gap-6">
                <span className="text-muted-foreground">
                  {config[name as Metric]?.label ?? name}
                </span>
                <span className="price font-bold">
                  {name === "revenue" ? formatNaira(Number(value)) : value}
                </span>
              </div>
            )}
          />
        }
      />
    </>
  );

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Sales</CardTitle>
        <CardDescription>Paid orders over the last {days} days</CardDescription>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Tabs
            value={metric}
            onValueChange={(value) => setMetric(value as Metric)}
          >
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-72 w-full">
          {metric === "revenue" ? (
            <AreaChart {...common}>
              {axes}
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <Area
                dataKey="revenue"
                type="monotone"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fill="url(#fillRevenue)"
              />
            </AreaChart>
          ) : (
            <BarChart {...common}>
              {axes}
              <Bar
                dataKey="orders"
                fill="var(--color-orders)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
