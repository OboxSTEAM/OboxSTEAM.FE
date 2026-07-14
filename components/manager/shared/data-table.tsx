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

export type ColumnDef<T> = {
  header: string;
  accessorKey?: keyof T;
  className?: string;
  render?: (row: T) => ReactNode;
};

type ManagerDataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Custom empty component
  emptyState?: ReactNode;
};

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
      {/* Table container with styling */}
      <div className="rounded-xl border border-[#E5E5E0] bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#FAFAF5]">
            <TableRow className="border-[#E5E5E0] hover:bg-[#FAFAF5]">
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={cn(
                    "px-4 py-3.5 font-heading text-xs font-bold uppercase tracking-wider text-[#2D2D2D]",
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading State (Skeleton Rows)
              [...Array(skeletonRows)].map((_, rIdx) => (
                <TableRow key={rIdx} className="border-[#E5E5E0]">
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx} className="px-4 py-4">
                      <Skeleton className="h-4 w-full rounded-sm bg-[#E5E5E0]/40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <div className="py-12 text-center text-sm text-[#6B6B6B]">
                      Không tìm thấy dữ liệu.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              // Render Real Data Rows
              data.map((row, rIdx) => (
                <TableRow
                  key={rIdx}
                  className="border-[#E5E5E0] hover:bg-[#FAFAF5]/50 transition-colors"
                >
                  {columns.map((col, cIdx) => {
                    const value = col.accessorKey ? (row[col.accessorKey] as any) : undefined;
                    return (
                      <TableCell
                        key={cIdx}
                        className={cn(
                          "px-4 py-3.5 text-sm text-[#2D2D2D] font-normal font-sans",
                          col.className
                        )}
                      >
                        {col.render ? col.render(row) : value !== undefined ? String(value) : "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {showPagination && onPageChange ? (
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-xs text-[#6B6B6B]">
            Trang <span className="font-semibold text-[#2D2D2D]">{currentPage}</span> trên{" "}
            <span className="font-semibold text-[#2D2D2D]">{totalPages}</span>
          </div>

          <Pagination className="mx-0 w-auto">
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  text="Trước"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={cn(
                    "h-8 rounded-md text-xs font-semibold px-2 cursor-pointer border-[#E5E5E0]",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Basic logic: show all for small pages, otherwise show current/ellipsis (expanded later if needed)
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === currentPage}
                      onClick={() => onPageChange(pageNum)}
                      className={cn(
                        "h-8 w-8 rounded-md text-xs font-semibold cursor-pointer border-[#E5E5E0]",
                        pageNum === currentPage
                          ? "bg-[#E94B3C] text-white hover:bg-[#E94B3C]/90 hover:text-white"
                          : "text-[#6B6B6B] hover:bg-[#F5F5F0]"
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
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  className={cn(
                    "h-8 rounded-md text-xs font-semibold px-2 cursor-pointer border-[#E5E5E0]",
                    currentPage === totalPages && "pointer-events-none opacity-50"
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

// Utility import inside file since it uses cn
import { cn } from "@/lib/utils";
