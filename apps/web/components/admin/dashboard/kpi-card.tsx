import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  change,
  hint,
  tone = "default",
  icon,
}: Readonly<{
  title: string;
  value: string;
  change?: number | null;
  hint?: string;
  tone?: "default" | "warning";
  icon?: React.ReactNode;
}>) {
  const showChange = change !== undefined;
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          {title}
          {icon}
        </CardDescription>
        <CardTitle
          className={cn(
            "price text-3xl font-extrabold tracking-tight",
            tone === "warning" && "text-warning",
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-sm">
        {showChange ? (
          change === null ? (
            <Badge variant="secondary">New</Badge>
          ) : (
            <Badge
              variant="outline"
              className={cn(change >= 0 ? "text-success" : "text-destructive")}
            >
              {change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              <span className="price">
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            </Badge>
          )
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}
