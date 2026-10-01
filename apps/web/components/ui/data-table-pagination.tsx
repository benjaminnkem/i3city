"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

type PageToken = number | "start-gap" | "end-gap";

function pageTokens(page: number, pageCount: number): PageToken[] {
  const wanted = new Set(
    [1, page - 1, page, page + 1, pageCount].filter(
      (value) => value >= 1 && value <= pageCount,
    ),
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  const tokens: PageToken[] = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && value - previous > 1) {
      tokens.push(previous === 1 ? "start-gap" : "end-gap");
    }
    tokens.push(value);
  });
  return tokens;
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: DataTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-muted-foreground text-small price">
        {total === 0 ? "No results" : `Showing ${from} to ${to} of ${total}`}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go to previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
          </PaginationItem>
          {pageTokens(page, pageCount).map((token) =>
            typeof token === "number" ? (
              <PaginationItem key={token}>
                <Button
                  variant={token === page ? "outline" : "ghost"}
                  size="icon"
                  aria-label={`Go to page ${token}`}
                  aria-current={token === page ? "page" : undefined}
                  onClick={() => onPageChange(token)}
                  className="price"
                >
                  {token}
                </Button>
              </PaginationItem>
            ) : (
              <PaginationItem key={token}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go to next page"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
