"use client";

import {
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { InboxIcon } from "lucide-react";
import { useState } from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "@/components/ui/data-table-pagination";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}

const CLIENT_PAGE_SIZE = 10;
const SKELETON_ROWS = 5;

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: DataTablePaginationProps;
  paginate?: boolean;
  pageSize?: number;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  loading = false,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  pagination,
  paginate = true,
  pageSize = CLIENT_PAGE_SIZE,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
}: Readonly<DataTableProps<TData, TValue>>) {
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const serverPaged = pagination !== undefined;
  const serverSorted = onSortingChange !== undefined;

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: serverSorted ? undefined : getSortedRowModel(),
    getPaginationRowModel:
      serverPaged || !paginate ? undefined : getPaginationRowModel(),
    manualPagination: serverPaged,
    manualSorting: serverSorted,
    onSortingChange: onSortingChange ?? setLocalSorting,
    onRowSelectionChange,
    enableRowSelection: onRowSelectionChange !== undefined,
    initialState: { pagination: { pageSize } },
    state: {
      sorting: sorting ?? localSorting,
      ...(rowSelection ? { rowSelection } : {}),
    },
  });

  const rows = table.getRowModel().rows;
  const clientPagination: DataTablePaginationProps = {
    page: table.getState().pagination.pageIndex + 1,
    pageSize: table.getState().pagination.pageSize,
    total: data.length,
    onPageChange: (page) => table.setPageIndex(page - 1),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.column.columnDef.meta?.className}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index}>
                  {columns.map((_column, columnIndex) => (
                    <TableCell key={columnIndex}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Empty className="border-0 py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <InboxIcon />
                      </EmptyMedia>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      {emptyDescription ? (
                        <EmptyDescription>{emptyDescription}</EmptyDescription>
                      ) : null}
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {paginate || serverPaged ? (
        <DataTablePagination {...(pagination ?? clientPagination)} />
      ) : null}
    </div>
  );
}
