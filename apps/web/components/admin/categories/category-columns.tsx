"use client";

import type { AdminCategory } from "@repo/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CategoryColumnActions {
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
  lastIndex: number;
  busy: boolean;
}

export function categoryColumns({
  onMove,
  onEdit,
  onDelete,
  lastIndex,
  busy,
}: CategoryColumnActions): ColumnDef<AdminCategory>[] {
  return [
    {
      id: "order",
      header: "Order",
      enableSorting: false,
      meta: { className: "w-28" },
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${row.original.name} up`}
            disabled={busy || row.index === 0}
            onClick={() => onMove(row.index, -1)}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Move ${row.original.name} down`}
            disabled={busy || row.index === lastIndex}
            onClick={() => onMove(row.index, 1)}
          >
            <ArrowDownIcon />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: false,
      cell: ({ row }) => <span className="font-bold">{row.original.name}</span>,
    },
    {
      accessorKey: "slug",
      header: "Slug",
      enableSorting: false,
      meta: { className: "text-muted-foreground hidden sm:table-cell" },
    },
    {
      accessorKey: "productCount",
      header: "Products",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="price">{row.original.productCount}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { className: "w-14 text-right" },
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${row.original.name}`}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
