"use client";

import { formatNaira, type AdminProduct } from "@repo/types";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ProductThumb } from "./product-thumb";
import { QuickStock } from "./quick-stock";

export interface ProductColumnActions {
  onToggleActive: (product: AdminProduct, active: boolean) => void;
  onToggleFeatured: (product: AdminProduct, featured: boolean) => void;
  onSaveStock: (product: AdminProduct, stock: number) => void;
  onDelete: (product: AdminProduct) => void;
  savingId: string | null;
}

export function productColumns({
  onToggleActive,
  onToggleFeatured,
  onSaveStock,
  onDelete,
  savingId,
}: ProductColumnActions): ColumnDef<AdminProduct>[] {
  return [
    {
      id: "select",
      enableSorting: false,
      meta: { className: "w-10" },
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all on this page"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-48 items-center gap-3">
          <ProductThumb url={row.original.imageUrls[0]} />
          <div className="flex min-w-0 flex-col">
            <Link
              href={`/admin/products/${row.original.id}`}
              className="truncate font-bold hover:underline"
            >
              {row.original.name}
            </Link>
            <span className="text-muted-foreground truncate text-sm">
              {row.original.sku ?? row.original.brand ?? "No SKU"}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      enableSorting: false,
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => (
        <span className={row.original.category ? "" : "text-muted-foreground"}>
          {row.original.category?.name ?? "Uncategorised"}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="price text-primary font-bold">
            {formatNaira(row.original.price)}
          </span>
          {row.original.compareAtPrice ? (
            <span className="price text-muted-foreground text-sm line-through">
              {formatNaira(row.original.compareAtPrice)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => (
        <QuickStock
          name={row.original.name}
          stock={row.original.stock}
          saving={savingId === row.original.id}
          onSave={(stock) => onSaveStock(row.original, stock)}
        />
      ),
    },
    {
      id: "active",
      header: "Visible",
      enableSorting: false,
      cell: ({ row }) => (
        <Switch
          aria-label={`${row.original.name} visible in store`}
          checked={row.original.active}
          onCheckedChange={(checked) => onToggleActive(row.original, checked)}
        />
      ),
    },
    {
      id: "featured",
      header: "Featured",
      enableSorting: false,
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={row.original.featured}
          aria-label={`${row.original.featured ? "Unfeature" : "Feature"} ${row.original.name}`}
          onClick={() => onToggleFeatured(row.original, !row.original.featured)}
        >
          <StarIcon
            className={cn(
              row.original.featured
                ? "fill-primary text-primary"
                : "text-muted-foreground",
            )}
          />
        </Button>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      enableSorting: false,
      meta: { className: "text-muted-foreground hidden 2xl:table-cell" },
      cell: ({ row }) =>
        formatDistanceToNow(parseISO(row.original.updatedAt), {
          addSuffix: true,
        }),
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
            <DropdownMenuItem
              render={<Link href={`/admin/products/${row.original.id}`} />}
            >
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
