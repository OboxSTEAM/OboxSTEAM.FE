import { cn } from "@/lib/utils";

import type { ScheduleViewMode } from "./types";

export function ViewModeSwitch({
  value,
  onChange,
}: {
  value: ScheduleViewMode;
  onChange: (next: ScheduleViewMode) => void;
}) {
  return (
    <div
      className="inline-flex h-10 self-start rounded-xl bg-muted p-1 sm:self-end"
      role="group"
      aria-label="Chế độ xem lịch"
    >
      {(["week", "month"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "h-full min-w-[4.25rem] rounded-lg px-3.5 text-sm font-semibold transition-colors",
            value === mode
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {mode === "week" ? "Tuần" : "Tháng"}
        </button>
      ))}
    </div>
  );
}
