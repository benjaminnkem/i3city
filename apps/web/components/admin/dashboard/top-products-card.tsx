"use client";

import { formatNaira, type TopProduct } from "@repo/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function TopProductsCard({
  products,
}: Readonly<{ products: TopProduct[] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>By revenue, last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center">
            Sales will show here once orders are paid.
          </p>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart
              data={products}
              layout="vertical"
              margin={{ left: 0, right: 12 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={150}
                tickFormatter={(value: string) =>
                  value.length > 24 ? `${value.slice(0, 23)}…` : value
                }
              />
              <XAxis type="number" hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="flex w-full flex-col gap-1">
                        <span className="font-bold">{item.payload.name}</span>
                        <span className="price">
                          {formatNaira(Number(value))} · {item.payload.units}{" "}
                          sold
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
