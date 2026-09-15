"use client";

import { useEffect } from "react";

import { useSlidingTabs } from "@/components/transitions/use-sliding-tabs";
import { cn } from "@/lib/utils";

import type { ScheduleViewMode } from "./types";

export function ViewModeSwitch({
  value,
  onChange,
}: {
  value: ScheduleViewMode;
  onChange: (next: ScheduleViewMode) => void;
}) {
  const { tabsRef, pillRef, syncPill } = useSlidingTabs();

  useEffect(() => {
    syncPill(true);
  }, [value, syncPill]);

  return (
    <div
      ref={tabsRef}
      className={cn(
        "t-tabs h-10 self-start rounded-xl bg-muted p-1 sm:self-end",
        "[--tabs-bar-bg:var(--muted)] [--tabs-pill-bg:var(--card)]",
        "[--tabs-text-muted:var(--muted-foreground)] [--tabs-text-active:var(--foreground)]",
      )}
      role="tablist"
      aria-label="Chế độ xem lịch"
    >
      <span className="t-tabs-pill top-1 h-[calc(100%-0.5rem)] rounded-lg shadow-sm" ref={pillRef} aria-hidden />
      {(["week", "month"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          onClick={() => {
            onChange(mode);
          }}
          className={cn(
            "t-tab h-full min-w-[4.25rem] rounded-lg px-3.5 text-sm font-semibold",
            value === mode ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {mode === "week" ? "Tuần" : "Tháng"}
        </button>
      ))}
    </div>
  );
}
