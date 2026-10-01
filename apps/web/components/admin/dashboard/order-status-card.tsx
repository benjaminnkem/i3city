"use client";

import type { StatusCount } from "@repo/types";
import { Cell, Pie, PieChart } from "recharts";
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
import { STATUS_COLORS, STATUS_LABELS } from "./dashboard-format";

export function OrderStatusCard({
  statuses,
}: Readonly<{ statuses: StatusCount[] }>) {
  const total = statuses.reduce((sum, entry) => sum + entry.count, 0);
  const config = Object.fromEntries(
    statuses.map((entry) => [
      entry.status,
      {
        label: STATUS_LABELS[entry.status],
        color: STATUS_COLORS[entry.status],
      },
    ]),
  ) satisfies ChartConfig;
  const data = statuses.map((entry) => ({
    status: entry.status,
    count: entry.count,
    fill: STATUS_COLORS[entry.status],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>Placed in the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {total === 0 ? (
          <p className="text-muted-foreground py-10 text-center">
            No orders in this period yet.
          </p>
        ) : (
          <>
            <ChartContainer config={config} className="mx-auto h-44 w-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="status" hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={52}
                  outerRadius={80}
                  strokeWidth={2}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="flex flex-col gap-2 text-sm">
              {statuses.map((entry) => (
                <li
                  key={entry.status}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                    />
                    {STATUS_LABELS[entry.status]}
                  </span>
                  <span className="price font-bold">{entry.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
