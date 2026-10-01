"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: Readonly<{
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUpIcon />
      ) : sorted === "desc" ? (
        <ArrowDownIcon />
      ) : (
        <ArrowUpDownIcon />
      )}
    </Button>
  );
}
