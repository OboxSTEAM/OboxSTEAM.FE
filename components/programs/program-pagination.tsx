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
    wrapper:
      "rounded-xl border border-border bg-card px-2 py-1.5 shadow-sm",
    link: "min-w-10 h-9 border border-border bg-card text-foreground font-medium shadow-sm hover:border-foreground/20 hover:bg-muted",
    active:
      "min-w-10 h-9 border border-primary bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 hover:text-primary-foreground",
    disabled:
      "border-border bg-muted text-muted-foreground/45 cursor-not-allowed shadow-none hover:bg-muted hover:border-border",
    navButton:
      "h-9 min-w-[4.5rem] border border-border bg-card px-3 font-semibold text-foreground shadow-sm hover:border-foreground/20 hover:bg-muted",
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
      <PaginationContent className={cn("gap-1.5", themeClass.wrapper)}>
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
            Trước
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
            Sau
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
