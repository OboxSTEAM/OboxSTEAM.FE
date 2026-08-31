import { formatDayColumnLabel } from "@/lib/schedules/week";

import { ScheduleSessionCard } from "./session-card";
import type { ScheduleDayData, ScheduleDisplaySession } from "./types";

export function ScheduleMonthDayAgenda<T extends ScheduleDisplaySession>({
  date,
  day,
  onOpen,
  emptyLabel = "Không có buổi học",
  showTitle = false,
}: {
  date: string | null;
  day: ScheduleDayData<T> | undefined;
  onOpen: (session: T) => void;
  emptyLabel?: string;
  showTitle?: boolean;
}) {
  const heading = date ? formatDayColumnLabel(date) : null;
  const sessions = day?.sessions ?? [];

  return (
    <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-20">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Buổi trong ngày
      </p>
      <h2 className="mt-1 font-heading text-lg font-bold text-foreground">
        {heading ? `${heading.weekday} · ${heading.dayMonth}` : "Chọn một ngày"}
      </h2>
      <div className="mt-3 space-y-2.5">
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          sessions.map((session) => (
            <ScheduleSessionCard
              key={session.id}
              session={session}
              showTitle={showTitle}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </aside>
  );
}
