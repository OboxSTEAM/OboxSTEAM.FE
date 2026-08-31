"use client";

import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  formatVietnamTimeRange,
  getMonthGridCells,
  isSameMonthDateOnly,
  isTodayDateOnly,
} from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

import { sessionKindVisual } from "./session-kind-visual";
import type { ScheduleDayData, ScheduleDisplaySession } from "./types";

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
const MONTH_MAX_CHIPS = 3;

export function ScheduleMonthGrid<T extends ScheduleDisplaySession>({
  year,
  month,
  daysByDate,
  selectedDay,
  onSelectDay,
}: {
  year: number;
  month: number;
  daysByDate: Map<string, ScheduleDayData<T>>;
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
}) {
  const cells = useMemo(
    () => getMonthGridCells(year, month),
    [year, month],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const day = daysByDate.get(date);
          const sessions = day?.sessions ?? [];
          const inMonth = isSameMonthDateOnly(date, year, month);
          const today = isTodayDateOnly(date);
          const selected = selectedDay === date;
          const dayNum = Number(date.slice(8, 10));
          const visible = sessions.slice(0, MONTH_MAX_CHIPS);
          const overflow = sessions.length - visible.length;

          return (
            <div
              key={date}
              role="button"
              tabIndex={inMonth ? 0 : -1}
              onClick={() => {
                if (inMonth) onSelectDay(date);
              }}
              onKeyDown={(event) => {
                if (!inMonth) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDay(date);
                }
              }}
              aria-pressed={selected}
              aria-label={`${dayNum}${sessions.length ? `, ${sessions.length} buổi` : ""}`}
              className={cn(
                "flex min-h-[5.25rem] flex-col border-b border-l border-border p-1.5 sm:min-h-[7rem] sm:p-2",
                !inMonth && "bg-muted/35",
                inMonth &&
                  "cursor-pointer bg-card hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4FC3F7]/50",
                selected && inMonth && "bg-primary/10",
                today && inMonth && !selected && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "mb-1 flex size-7 items-center justify-center rounded-full text-[12px] font-bold tabular-nums sm:size-8 sm:text-[13px]",
                  today
                    ? "bg-primary text-primary-foreground"
                    : selected
                      ? "bg-primary/15 text-primary"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground",
                )}
              >
                {dayNum}
              </span>
              {inMonth ? (
                <div className="flex min-h-0 flex-1 flex-col gap-1">
                  {visible.map((session) => {
                    const time = formatVietnamTimeRange(
                      session.startTime,
                      session.endTime,
                    ).split(" – ")[0];
                    const { chip } = sessionKindVisual(session.sessionKind);
                    return (
                      <span
                        key={session.id}
                        title={`${session.className} · ${formatVietnamTimeRange(session.startTime, session.endTime)}`}
                        className={cn(
                          "hidden w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight sm:block",
                          chip,
                          session.status === "Cancelled" &&
                            "opacity-50 line-through",
                        )}
                      >
                        <span className="font-mono tabular-nums">{time}</span>
                        <span>
                          {" "}
                          · {session.classCode || session.className}
                        </span>
                      </span>
                    );
                  })}
                  <div className="flex flex-wrap items-center gap-1 sm:hidden">
                    {sessions.slice(0, 4).map((session) => (
                      <span
                        key={session.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          sessionKindVisual(session.sessionKind).dot,
                        )}
                        aria-hidden
                      />
                    ))}
                    {sessions.length > 4 ? (
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        +{sessions.length - 4}
                      </span>
                    ) : null}
                  </div>
                  {overflow > 0 ? (
                    <span className="hidden px-1 text-[10px] font-semibold text-muted-foreground sm:block">
                      +{overflow} buổi
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border bg-muted/30 px-3 py-2.5 text-[11px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#4FC3F7]" aria-hidden />
          Buổi học
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#7CB342]" aria-hidden />
          Ngoại khóa
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#FDD835]" aria-hidden />
          Kiểm tra
        </span>
      </div>
    </div>
  );
}

export function ScheduleMonthSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }).map((_, index) => (
          <Skeleton
            key={index}
            className="min-h-[4.5rem] rounded-none border-b border-l border-border sm:min-h-[6rem]"
          />
        ))}
      </div>
    </div>
  );
}
