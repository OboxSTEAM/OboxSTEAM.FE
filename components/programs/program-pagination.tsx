"use client";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type ProgramPaginationProps = {
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
};

const PAGE_LINK_CLASS =
  "min-w-8 border-transparent bg-transparent text-white/50 hover:bg-white/8 hover:text-white";
const PAGE_ACTIVE_CLASS = "bg-white/12 text-white font-medium hover:bg-white/12";
const PAGE_DISABLED_CLASS = "text-white/20 cursor-not-allowed hover:bg-transparent";

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}

export function ProgramPagination({
  currentPage,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
}: ProgramPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasPrevious}
            onClick={() => onPageChange(currentPage - 1)}
            className={cn(PAGE_LINK_CLASS, !hasPrevious && PAGE_DISABLED_CLASS)}
            aria-label="Trang trước"
          >
            Trước
          </Button>
        </PaginationItem>

        {pages.map((page) => (
          <PaginationItem key={page}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange(page)}
              aria-label={`Trang ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                PAGE_LINK_CLASS,
                page === currentPage && PAGE_ACTIVE_CLASS,
              )}
            >
              {page}
            </Button>
          </PaginationItem>
        ))}

        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasNext}
            onClick={() => onPageChange(currentPage + 1)}
            className={cn(PAGE_LINK_CLASS, !hasNext && PAGE_DISABLED_CLASS)}
            aria-label="Trang sau"
          >
            Sau
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
