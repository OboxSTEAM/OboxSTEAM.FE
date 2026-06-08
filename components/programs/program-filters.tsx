"use client";

import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type {
  ProgramCategory,
  ProgramLevel,
  ProgramListQuery,
} from "@/lib/api/programs";
import {
  DEFAULT_PROGRAM_QUERY,
  getSortOptionId,
  isProgramQueryFiltered,
  PROGRAM_CATEGORY_META,
  PROGRAM_CATEGORY_ORDER,
  PROGRAM_LEVEL_LABELS,
  PROGRAM_LEVEL_ORDER,
  PROGRAM_SORT_OPTIONS,
} from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

const LEVEL_ALL_VALUE = "all";
const SEARCH_DEBOUNCE_MS = 400;

const DARK_SELECT_TRIGGER =
  "h-9 min-w-[11rem] border-white/12 bg-[#2A2A2A] px-3 text-sm text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[#303030] hover:border-white/18 focus-visible:border-[#4FC3F7]/60 focus-visible:ring-[#4FC3F7]/25 [&_svg]:text-white/45";
const DARK_SELECT_CONTENT =
  "border border-white/12 bg-[#2A2A2A] p-1 text-white/90 shadow-[0_20px_48px_rgba(0,0,0,0.55)] ring-0 data-open:animate-none data-closed:animate-none";
const DARK_SELECT_ITEM =
  "rounded-md py-2 pl-2.5 pr-8 text-sm text-white/80 focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white [&_svg]:text-[#4FC3F7]";

type ProgramFiltersProps = {
  query: ProgramListQuery;
  searchInput: string;
  isSearchPending?: boolean;
  onSearchInputChange: (value: string) => void;
  onQueryChange: (patch: Partial<ProgramListQuery>) => void;
  onClearFilters: () => void;
};

function getLevelLabel(level: ProgramLevel | undefined): string {
  if (!level) {
    return "Tất cả cấp độ";
  }

  return PROGRAM_LEVEL_LABELS[level];
}

function getSortLabel(query: ProgramListQuery): string {
  return (
    PROGRAM_SORT_OPTIONS.find((option) => option.id === getSortOptionId(query))
      ?.label ?? PROGRAM_SORT_OPTIONS[0].label
  );
}

export function ProgramFilters({
  query,
  searchInput,
  isSearchPending = false,
  onSearchInputChange,
  onQueryChange,
  onClearFilters,
}: ProgramFiltersProps) {
  const hasActiveFilters = isProgramQueryFiltered(query);

  const handleCategoryToggle = (category: ProgramCategory) => {
    onQueryChange({
      category: query.category === category ? undefined : category,
      page: 1,
    });
  };

  const handleLevelChange = (value: string | null) => {
    onQueryChange({
      level:
        value && value !== LEVEL_ALL_VALUE ? (value as ProgramLevel) : undefined,
      page: 1,
    });
  };

  const handleSortChange = (value: string | null) => {
    const option = PROGRAM_SORT_OPTIONS.find((item) => item.id === value);
    if (!option) return;

    onQueryChange({
      sortBy: option.sortBy,
      isDescending: option.isDescending,
      page: 1,
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-[#222222]/80 p-4 sm:p-5 backdrop-blur-sm">
      <div className="relative w-full">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder="Tìm chương trình..."
          aria-label="Tìm chương trình"
          className="h-11 border-white/12 bg-[#2A2A2A] pl-10 pr-10 text-sm text-white placeholder:text-white/35 focus-visible:border-[#4FC3F7]/60 focus-visible:ring-[#4FC3F7]/25"
        />
        {isSearchPending && (
          <Loader2
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[#4FC3F7]/80"
            aria-label="Đang tìm kiếm"
          />
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
            Lọc theo STEAM
          </p>
          <p className="text-xs text-white/35">Nhấn để chọn lĩnh vực</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PROGRAM_CATEGORY_ORDER.map((category) => {
            const meta = PROGRAM_CATEGORY_META[category];
            const isActive = query.category === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                aria-pressed={isActive}
                aria-label={`Lọc ${meta.label}`}
                className={cn(
                  "group inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-200",
                  "hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.28)] active:scale-[0.98]",
                  isActive
                    ? "border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.22)]"
                    : "border-white/12 bg-[#2A2A2A] text-white/70 hover:border-white/22 hover:text-white/90",
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${meta.color}22`,
                        borderColor: `${meta.color}55`,
                        color: meta.color,
                      }
                    : undefined
                }
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold"
                  style={{
                    backgroundColor: `${meta.color}${isActive ? "33" : "22"}`,
                    color: meta.color,
                  }}
                  aria-hidden="true"
                >
                  {meta.letter}
                </span>
                <span className="text-sm font-semibold leading-tight">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-white/8 pt-4">
        <Select
          value={query.level ?? LEVEL_ALL_VALUE}
          onValueChange={handleLevelChange}
        >
          <SelectTrigger className={DARK_SELECT_TRIGGER} size="default">
            <span className="truncate">{getLevelLabel(query.level)}</span>
          </SelectTrigger>
          <SelectContent
            className={DARK_SELECT_CONTENT}
            alignItemWithTrigger={false}
            sideOffset={8}
            align="start"
          >
            <SelectItem value={LEVEL_ALL_VALUE} className={DARK_SELECT_ITEM}>
              Tất cả cấp độ
            </SelectItem>
            {PROGRAM_LEVEL_ORDER.map((level) => (
              <SelectItem key={level} value={level} className={DARK_SELECT_ITEM}>
                {PROGRAM_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={getSortOptionId(query)}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className={DARK_SELECT_TRIGGER} size="default">
            <span className="truncate">{getSortLabel(query)}</span>
          </SelectTrigger>
          <SelectContent
            className={DARK_SELECT_CONTENT}
            alignItemWithTrigger={false}
            sideOffset={8}
            align="start"
          >
            {PROGRAM_SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                className={DARK_SELECT_ITEM}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className={cn(
            "h-9 text-white/45 hover:bg-white/8 hover:text-white transition-opacity duration-200",
            hasActiveFilters ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!hasActiveFilters}
          tabIndex={hasActiveFilters ? 0 : -1}
        >
          <X size={14} aria-hidden="true" />
          Xóa bộ lọc
        </Button>
      </div>
    </div>
  );
}

export function getClearedProgramQuery(): ProgramListQuery {
  return { ...DEFAULT_PROGRAM_QUERY };
}

export const PROGRAM_SEARCH_DEBOUNCE_MS = SEARCH_DEBOUNCE_MS;
