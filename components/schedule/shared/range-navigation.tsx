import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ScheduleViewMode } from "./types";

export function ScheduleRangeNavigation({
  viewMode,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
}: {
  viewMode: ScheduleViewMode;
  rangeLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-xl"
        onClick={onPrev}
        aria-label={viewMode === "week" ? "Tuần trước" : "Tháng trước"}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-[10.5rem] rounded-xl border border-border bg-card px-3 py-2 text-center">
        <p className="font-heading text-sm font-semibold text-foreground">
          {rangeLabel}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-xl"
        onClick={onNext}
        aria-label={viewMode === "week" ? "Tuần sau" : "Tháng sau"}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="h-9 rounded-xl px-3 text-sm font-semibold"
        onClick={onToday}
      >
        Hôm nay
      </Button>
    </div>
  );
}
