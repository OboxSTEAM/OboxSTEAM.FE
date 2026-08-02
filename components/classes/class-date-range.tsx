import { parseApiDateTime } from "@/lib/api/datetime";
import { cn } from "@/lib/utils";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

type DateParts = {
  day: string;
  month: string;
  year: number;
  hours: string;
  minutes: string;
  dateLabel: string;
  timeLabel: string;
};

function toParts(value: string | null | undefined): DateParts | null {
  const date = parseApiDateTime(value);
  if (!date) return null;

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return {
    day,
    month,
    year,
    hours,
    minutes,
    dateLabel: `${day}/${month}/${year}`,
    timeLabel: `${hours}:${minutes}`,
  };
}

function isSameCalendarDay(left: DateParts, right: DateParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day
  );
}

export type ClassDateRangeProps = {
  startDate: string | null | undefined;
  endDate?: string | null | undefined;
  /** `stack` for table cells; `inline` for cards. */
  layout?: "stack" | "inline";
  className?: string;
};

/**
 * Readable class start/end: date first, time secondary — avoids
 * `16:20 16/08 → 17:20 30/08` visual clutter.
 * Pass only `startDate` for a single timestamp (e.g. approved-at).
 */
export function ClassDateRange({
  startDate,
  endDate,
  layout = "stack",
  className,
}: ClassDateRangeProps) {
  const start = toParts(startDate);
  const end = toParts(endDate);

  if (!start && !end) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  if (start && !end) {
    return (
      <div
        className={cn(
          layout === "inline"
            ? "flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
            : "space-y-0.5",
          className,
        )}
      >
        <p className="font-medium tabular-nums text-foreground">
          {start.dateLabel}
        </p>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {start.timeLabel}
        </p>
      </div>
    );
  }

  if (start && end && isSameCalendarDay(start, end)) {
    return (
      <div
        className={cn(
          layout === "inline"
            ? "flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
            : "space-y-0.5",
          className,
        )}
      >
        <p className="font-medium tabular-nums text-foreground">
          {start.dateLabel}
        </p>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {start.timeLabel}–{end.timeLabel}
        </p>
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div className={cn("min-w-0 space-y-0.5", className)}>
        <p className="font-medium tabular-nums text-foreground">
          {start?.dateLabel ?? "—"}
          <span className="mx-1.5 font-normal text-muted-foreground">→</span>
          {end?.dateLabel ?? "—"}
        </p>
        {(start || end) && (
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {start?.timeLabel ?? "—"}
            <span className="mx-1 text-muted-foreground/70">·</span>
            {end?.timeLabel ?? "—"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline gap-2">
        <span className="w-5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Từ
        </span>
        <span className="min-w-0">
          <span className="font-medium tabular-nums text-foreground">
            {start?.dateLabel ?? "—"}
          </span>
          {start ? (
            <span className="ml-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {start.timeLabel}
            </span>
          ) : null}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="w-5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Đến
        </span>
        <span className="min-w-0">
          <span className="font-medium tabular-nums text-foreground">
            {end?.dateLabel ?? "—"}
          </span>
          {end ? (
            <span className="ml-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {end.timeLabel}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
