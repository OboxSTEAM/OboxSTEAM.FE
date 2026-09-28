"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

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
  {
    wrapper: string;
    link: string;
    active: string;
    disabled: string;
    navButton: string;
  }
> = {
  dark: {
    wrapper: "",
    link: "min-w-9 border-transparent bg-transparent text-white/50 hover:bg-white/8 hover:text-white",
    active: "bg-white/12 text-white font-medium hover:bg-white/12",
    disabled: "text-white/20 cursor-not-allowed hover:bg-transparent",
    navButton: "min-w-9 border-transparent bg-transparent text-white/50 hover:bg-white/8 hover:text-white",
  },
  light: {
    wrapper: "",
    link: "size-9 min-w-9 rounded-lg text-sm font-medium text-[#6B6B6B] tabular-nums hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
    active:
      "bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
    disabled:
      "cursor-not-allowed text-[#C4C4BE] hover:bg-transparent hover:text-[#C4C4BE] disabled:opacity-100",
    navButton:
      "h-9 gap-1 rounded-lg px-2.5 text-sm font-medium text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]",
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
    <Pagination className={cn("mt-10", className)}>
      <PaginationContent className={cn("gap-1", themeClass.wrapper)}>
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            size="default"
            disabled={!hasPrevious}
            onClick={() => onPageChange(currentPage - 1)}
            className={cn(
              theme === "light" ? themeClass.navButton : themeClass.link,
              !hasPrevious && themeClass.disabled,
            )}
            aria-label="Trang trước"
          >
            <ChevronLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Trước</span>
          </Button>
        </PaginationItem>

        {pages.map((page) => (
          <PaginationItem key={page}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
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
            size="default"
            disabled={!hasNext}
            onClick={() => onPageChange(currentPage + 1)}
            className={cn(
              theme === "light" ? themeClass.navButton : themeClass.link,
              !hasNext && themeClass.disabled,
            )}
            aria-label="Trang sau"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
