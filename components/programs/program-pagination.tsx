"use client";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type ProgramPaginationTheme = "dark" | "light";

type ProgramPaginationProps = {
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  theme?: ProgramPaginationTheme;
  className?: string;
};

const PAGE_THEME_CLASS: Record<
  ProgramPaginationTheme,
  { link: string; active: string; disabled: string }
> = {
  dark: {
    link: "min-w-8 border-transparent bg-transparent text-white/50 hover:bg-white/8 hover:text-white",
    active: "bg-white/12 text-white font-medium hover:bg-white/12",
    disabled: "text-white/20 cursor-not-allowed hover:bg-transparent",
  },
  light: {
    link: "min-w-8 border-transparent bg-transparent text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
    active: "bg-[#F5F5F0] text-[#2D2D2D] font-medium hover:bg-[#F5F5F0]",
    disabled: "text-[#6B6B6B]/40 cursor-not-allowed hover:bg-transparent",
  },
};

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
  theme = "dark",
  className,
}: ProgramPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);
  const themeClass = PAGE_THEME_CLASS[theme];

  return (
    <Pagination className={cn("mt-6", className)}>
      <PaginationContent>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasPrevious}
            onClick={() => onPageChange(currentPage - 1)}
            className={cn(themeClass.link, !hasPrevious && themeClass.disabled)}
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
                themeClass.link,
                page === currentPage && themeClass.active,
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
            className={cn(themeClass.link, !hasNext && themeClass.disabled)}
            aria-label="Trang sau"
          >
            Sau
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
