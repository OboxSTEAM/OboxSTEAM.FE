import { formatDayColumnLabel, isTodayDateOnly } from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

import { ScheduleSessionCard } from "./session-card";
import type { ScheduleDayData, ScheduleDisplaySession } from "./types";

export function ScheduleDayColumn<T extends ScheduleDisplaySession>({
  day,
  onOpen,
  isFirst,
  isLast,
  emptyLabel = "Trống",
  showTitle = false,
}: {
  day: ScheduleDayData<T>;
  onOpen: (session: T) => void;
  isFirst?: boolean;
  isLast?: boolean;
  emptyLabel?: string;
  showTitle?: boolean;
}) {
  const { weekday, dayMonth } = formatDayColumnLabel(day.date);
  const isToday = isTodayDateOnly(day.date);
  const sessionCount = day.sessions.length;
  const hasSessions = sessionCount > 0;
  const dayNumber = dayMonth.split("/")[0];

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col",
        !isLast && "border-r border-border",
        isToday
          ? "bg-primary/5 dark:bg-primary/10"
          : hasSessions
            ? "bg-card"
            : "bg-muted/40",
      )}
    >
      <div
        className={cn(
          "border-b border-border px-2 py-3 text-center xl:px-3",
          isToday ? "bg-card" : "bg-muted/50",
          isFirst && "rounded-tl-2xl",
          isLast && "rounded-tr-2xl",
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {weekday}
        </p>
        <p
          className={cn(
            "mx-auto mt-1 flex size-8 items-center justify-center font-heading text-sm font-bold tabular-nums",
            isToday
              ? "rounded-full bg-primary text-primary-foreground"
              : "text-foreground",
          )}
        >
          {dayNumber}
        </p>
        {isToday ? (
          <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
            Hôm nay
          </span>
        ) : hasSessions ? (
          <span className="mt-1 inline-flex rounded-full bg-foreground/8 px-2 py-0.5 font-mono text-[9px] font-bold text-foreground">
            {sessionCount} buổi
          </span>
        ) : (
          <span className="mt-1 block h-[18px]" aria-hidden />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-2">
        {!hasSessions ? (
          <p className="mt-3 px-1 text-center text-[11px] font-medium text-muted-foreground/70">
            {emptyLabel}
          </p>
        ) : (
          day.sessions.map((session) => (
            <ScheduleSessionCard
              key={session.id}
              session={session}
              compact
              showTitle={showTitle}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
