"use client";

import type { CategoryShare } from "@repo/types";
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
  productCount: { label: "Products", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function CategoryCard({
  categories,
}: Readonly<{ categories: CategoryShare[] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products by category</CardTitle>
        <CardDescription>How your catalog is spread</CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center">
            No categories yet.
          </p>
        ) : (
          <ChartContainer config={config} className="h-64 w-full">
            <BarChart
              data={categories}
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
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="productCount"
                fill="var(--color-productCount)"
                radius={6}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
