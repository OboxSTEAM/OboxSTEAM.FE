"use client";

import type { DashboardRange } from "@/lib/api";
import { cn } from "@/lib/utils";

import { DASHBOARD_RANGE_OPTIONS } from "./dashboard-utils";

type DashboardRangeTabsProps = {
  range: DashboardRange;
  isLoading?: boolean;
  onChange: (next: DashboardRange) => void;
};

export function DashboardRangeTabs({
  range,
  isLoading,
  onChange,
}: DashboardRangeTabsProps) {
  return (
    <div
      id="dashboard-range"
      role="group"
      aria-label="Chọn khoảng thời gian thống kê"
      aria-busy={isLoading || undefined}
      className="grid w-full grid-cols-4 rounded-xl border border-border/70 bg-card p-1 sm:w-auto sm:min-w-[280px]"
    >
      {DASHBOARD_RANGE_OPTIONS.map((option) => {
        const active = option.value === range;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (option.value === range) return;
              onChange(option.value);
            }}
            className={cn(
              "rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.short}</span>
          </button>
        );
      })}
    </div>
  );
}
