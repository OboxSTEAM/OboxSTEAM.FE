"use client";

import { Search, X } from "lucide-react";
import { ClearableSearchInput } from "@/components/transitions/clearable-search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterDef = {
  key: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Wider dropdown for long labels (e.g. program names). */
  wide?: boolean;
};

type ManagerFilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  onClearFilters?: () => void;
  showClear?: boolean;
};

export function ManagerFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
  onClearFilters,
  showClear = false,
}: ManagerFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search and Filters group */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search Input wrapper */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-2.5 left-3 z-10 size-4 text-muted-foreground" />
          <ClearableSearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>

        {/* Dynamic Select Filters */}
        {filters.map((filter) => {
          const activeOption = filter.options.find((opt) => opt.value === filter.value);
          const labelToDisplay = activeOption ? activeOption.label : filter.placeholder;
          const isWide = filter.wide === true;

          return (
            <Select
              key={filter.key}
              value={filter.value || null}
              onValueChange={(val) => filter.onChange(val ?? "")}
            >
              <SelectTrigger
                className={cn(
                  THEME_SELECT_TRIGGER,
                  isWide && "max-w-[16rem]",
                )}
              >
                <span className="truncate">{labelToDisplay}</span>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                sideOffset={8}
                className={cn(
                  THEME_SELECT_CONTENT,
                  isWide &&
                    "w-auto! min-w-[min(100vw-2rem,22rem)] max-w-[min(100vw-2rem,28rem)]",
                )}
              >
                {filter.options.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className={cn(
                      THEME_SELECT_ITEM,
                      "cursor-pointer",
                      isWide &&
                        "items-start leading-snug [&_span]:shrink [&_span]:break-words [&_span]:whitespace-normal!",
                    )}
                    title={opt.label}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>

      {/* Clear Filters Actions */}
      {showClear && onClearFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
          Xóa bộ lọc
        </Button>
      ) : null}
    </div>
  );
}
