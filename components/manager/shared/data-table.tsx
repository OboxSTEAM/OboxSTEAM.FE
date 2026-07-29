"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  header: string;
  accessorKey?: keyof T;
  className?: string;
  /** Keep column visible while the table scrolls horizontally. */
  sticky?: "left" | "right";
  render?: (row: T) => ReactNode;
};

type ManagerDataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyState?: ReactNode;
};

function stickyCellClass(sticky: ColumnDef<unknown>["sticky"]): string {
  if (sticky === "left") {
    return cn(
      "sticky left-0 z-20",
      "border-r border-border/80",
      "shadow-[4px_0_12px_-8px_rgba(45,45,45,0.18)]",
    );
  }
  if (sticky === "right") {
    return cn(
      "sticky right-0 z-20",
      "border-l border-border/80",
      "shadow-[-4px_0_12px_-8px_rgba(45,45,45,0.18)]",
    );
  }
  return "";
}

export function ManagerDataTable<T>({
  columns,
  data,
  isLoading = false,
  skeletonRows = 5,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  emptyState,
}: ManagerDataTableProps<T>) {
  const showPagination = totalPages > 1 && !isLoading;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border hover:bg-muted/40">
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={cn(
                    "px-4 py-3.5 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground",
                    col.sticky && "bg-muted/40",
                    stickyCellClass(col.sticky),
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(skeletonRows)].map((_, rIdx) => (
                <TableRow key={rIdx} className="group border-border">
                  {columns.map((col, cIdx) => (
                    <TableCell
                      key={cIdx}
                      className={cn(
                        "px-4 py-4",
                        col.sticky && "bg-card group-hover:bg-muted/50",
                        stickyCellClass(col.sticky),
                        col.className,
                      )}
                    >
                      <Skeleton className="h-4 w-full rounded-sm bg-border/40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      Không tìm thấy dữ liệu.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rIdx) => (
                <TableRow
                  key={rIdx}
                  className="group border-border transition-colors hover:bg-muted/50"
                >
                  {columns.map((col, cIdx) => {
                    const value = col.accessorKey
                      ? (row[col.accessorKey] as unknown)
                      : undefined;
                    return (
                      <TableCell
                        key={cIdx}
                        className={cn(
                          "px-4 py-3.5 font-sans text-sm font-normal text-foreground",
                          col.sticky && "bg-card group-hover:bg-muted/50",
                          stickyCellClass(col.sticky),
                          col.className,
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : value !== undefined
                            ? String(value)
                            : "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && onPageChange ? (
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs text-muted-foreground">
            Trang{" "}
            <span className="font-semibold text-foreground">{currentPage}</span>{" "}
            trên{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </div>

          <Pagination className="mx-0 w-auto">
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  text="Trước"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={cn(
                    "h-8 cursor-pointer rounded-md border-border px-2 text-xs font-semibold",
                    currentPage === 1 && "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => onPageChange(pageNum)}
                      className={cn(
                        "h-8 w-8 cursor-pointer rounded-md border-border text-xs font-semibold",
                        pageNum === currentPage
                          ? "bg-primary text-white hover:bg-primary/90 hover:text-white"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  text="Sau"
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className={cn(
                    "h-8 cursor-pointer rounded-md border-border px-2 text-xs font-semibold",
                    currentPage === totalPages &&
                      "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
