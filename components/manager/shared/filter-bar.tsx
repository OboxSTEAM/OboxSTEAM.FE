"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E5E0] bg-white px-6 py-4">
      {/* Search and Filters group */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search Input wrapper */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-2.5 left-3 size-4 text-[#6B6B6B]" />
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9 pr-8 rounded-lg border-[#E5E5E0] text-sm text-[#2D2D2D] bg-[#FAFAF5]/50 focus-visible:ring-[#4FC3F7]"
          />
          {searchValue ? (
            <button
              onClick={() => onSearchChange("")}
              className="absolute top-2.5 right-2.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
              aria-label="Xóa tìm kiếm"
            >
              <X className="size-4 text-[#6B6B6B]" />
            </button>
          ) : null}
        </div>

        {/* Dynamic Select Filters */}
        {filters.map((filter) => {
          const activeOption = filter.options.find((opt) => opt.value === filter.value);
          const labelToDisplay = activeOption ? activeOption.label : filter.placeholder;

          return (
            <Select
              key={filter.key}
              value={filter.value || ""}
              onValueChange={(val) => filter.onChange(val ?? "")}
            >
              <SelectTrigger className="h-9 min-w-[140px] rounded-lg border-[#E5E5E0] bg-white text-xs font-semibold text-[#2D2D2D] hover:bg-[#FAFAF5]">
                <span className="truncate">{labelToDisplay}</span>
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border border-[#E5E5E0]">
                {filter.options.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer text-xs"
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
          className="h-9 gap-1.5 px-3 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]"
        >
          <X className="size-3.5" />
          Xóa bộ lọc
        </Button>
      ) : null}
    </div>
  );
}
