"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OpenEnrollmentClass, StudentScheduleInterval } from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import {
  getConflictingBusyIds,
  getConflictingSessionIds,
  overlaps,
} from "@/lib/classes/schedule-conflict";
import { cn } from "@/lib/utils";

type OpenClassWeekDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: OpenEnrollmentClass;
  /** Student's current schedule; `null` when conflicts can't be checked (guest / non-student). */
  busyIntervals: StudentScheduleInterval[] | null;
};

/** Compact week view of a recruiting class; days clashing with the student's schedule are flagged. */
export function OpenClassWeekDialog({
  open,
  onOpenChange,
  item,
  busyIntervals,
}: OpenClassWeekDialogProps) {
  const cohortLabel = item.code?.trim() || item.name?.trim() || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-3xl gap-3 p-4 sm:p-5">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 shrink-0 text-[#0288D1]" />
            Lịch học lớp{cohortLabel ? ` ${cohortLabel}` : ""}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {item.name?.trim() || "Lớp tuyển sinh"}
            {item.mentorName?.trim()
              ? ` · Mentor ${item.mentorName.trim()}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogClose />
        <WeekSchedule item={item} busyIntervals={busyIntervals} />
      </DialogPopup>
    </Dialog>
  );
}

function WeekSchedule({
  item,
  busyIntervals,
}: Pick<OpenClassWeekDialogProps, "item" | "busyIntervals">) {
  const entries = useMemo(
    () => buildWeekEntries(item, busyIntervals ?? []),
    [item, busyIntervals],
  );
  const [today] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(resolveInitialDate(entries, item, today)),
  );

  const firstEntry = entries[0];
  const lastEntry = entries.at(-1);
  const canGoPrev = !!firstEntry && weekStart > startOfWeek(firstEntry.start);
  const canGoNext = !!lastEntry && weekStart < startOfWeek(lastEntry.start);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 7);
  const weekEntries = entries.filter(
    (entry) => entry.start >= weekStart && entry.start < weekEnd,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <WeekNavButton
            label="Tuần trước"
            disabled={!canGoPrev}
            onClick={() => setWeekStart((current) => addDays(current, -7))}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </WeekNavButton>
          <p className="min-w-36 text-center text-sm font-semibold tabular-nums text-[#2D2D2D]">
            {formatWeekLabel(weekStart)}
          </p>
          <WeekNavButton
            label="Tuần sau"
            disabled={!canGoNext}
            onClick={() => setWeekStart((current) => addDays(current, 7))}
          >
            <ChevronRight className="size-4" aria-hidden />
          </WeekNavButton>
        </div>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6B6B6B]">
          <LegendItem className="border-[#4FC3F7]/50 bg-[#E8F7FD]">
            Buổi học của lớp
          </LegendItem>
          {busyIntervals != null ? (
            <LegendItem className="border-[#E94B3C]/50 bg-[#FFF0EE]">
              Trùng lịch của bạn
            </LegendItem>
          ) : null}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[#E5E5E0] pt-3 sm:grid-cols-7 sm:gap-1.5">
        {days.map((day, index) => {
          const dayEntries = weekEntries.filter((entry) =>
            isSameDay(entry.start, day),
          );
          const hasConflict = dayEntries.some(
            (entry) => entry.conflicts.length > 0,
          );
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-w-0 flex-col gap-1 sm:min-h-28",
                dayEntries.length === 0 && "hidden sm:flex",
              )}
            >
              <p
                className={cn(
                  "mb-0.5 flex items-center gap-1 text-[11px] font-semibold sm:justify-center",
                  hasConflict ? "text-[#a82a1e]" : "text-[#6B6B6B]",
                )}
              >
                {WEEKDAY_LABELS[index]}
                <span
                  className={cn(
                    "tabular-nums",
                    isToday && "rounded-md bg-[#0288D1] px-1 text-white",
                  )}
                >
                  {day.getDate()}/{day.getMonth() + 1}
                </span>
              </p>
              {dayEntries.map((entry) => (
                <WeekEntryChip key={entry.key} entry={entry} />
              ))}
            </div>
          );
        })}
      </div>

      {weekEntries.length === 0 ? (
        <p className="text-center text-xs text-[#6B6B6B]">
          {entries.length === 0
            ? "Lớp chưa có buổi học trên lịch."
            : "Tuần này không có buổi học."}
        </p>
      ) : null}
    </div>
  );
}

function WeekNavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-[#E5E5E0] bg-white text-[#2D2D2D] hover:bg-[#FAFAF5] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function LegendItem({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm border", className)} aria-hidden />
      {children}
    </li>
  );
}

function WeekEntryChip({ entry }: { entry: WeekEntry }) {
  const timeLabel = entry.isWindow
    ? CLASS_SESSION_KIND_LABELS.AssignmentWindow
    : formatTimeRange(entry.start, entry.end);
  const conflictClasses = [
    ...new Set(entry.conflicts.map((conflict) => conflict.classLabel)),
  ];
  const hasConflict = conflictClasses.length > 0;

  return (
    <div
      title={`${timeLabel} · ${entry.title}`}
      className={cn(
        "min-w-0 rounded-md px-1.5 py-1 text-[11px] leading-tight",
        hasConflict
          ? "bg-[#FFF0EE] text-[#a82a1e]"
          : "bg-[#E8F7FD] text-[#0277BD]",
      )}
    >
      <p className="font-semibold tabular-nums">{timeLabel}</p>
      <p className="truncate">{entry.title}</p>
      {hasConflict ? (
        <p className="mt-0.5 font-semibold break-words">
          Trùng lớp {conflictClasses.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type WeekConflict = { classLabel: string; start: Date; end: Date };

type WeekEntry = {
  key: string;
  start: Date;
  end: Date;
  title: string;
  isWindow: boolean;
  /** Student sessions overlapping this class session. */
  conflicts: WeekConflict[];
};

function buildWeekEntries(
  item: OpenEnrollmentClass,
  busyIntervals: StudentScheduleInterval[],
): WeekEntry[] {
  const options = { excludeClassId: item.classId };
  const conflictSessionIds = getConflictingSessionIds(
    item.sessions,
    busyIntervals,
    options,
  );
  const conflictBusyIds = getConflictingBusyIds(
    item.sessions,
    busyIntervals,
    options,
  );
  const conflictingBusy = busyIntervals.flatMap((busy): WeekConflict[] => {
    if (!conflictBusyIds.has(busy.classSessionId)) return [];
    const start = parseApiDateTime(busy.startTime);
    const end = parseApiDateTime(busy.endTime);
    if (!start || !end) return [];
    return [
      {
        classLabel:
          busy.classCode?.trim() || busy.className?.trim() || "khác",
        start,
        end,
      },
    ];
  });

  return item.sessions
    .flatMap((session): WeekEntry[] => {
      const start = parseApiDateTime(session.startTime);
      if (!start) return [];
      const end = parseApiDateTime(session.endTime) ?? start;
      return [
        {
          key: session.sessionId,
          start,
          end,
          title: session.title?.trim() || "Buổi học",
          isWindow: session.sessionKind === "AssignmentWindow",
          conflicts: conflictSessionIds.has(session.sessionId)
            ? conflictingBusy.filter((busy) =>
                overlaps(start, end, busy.start, busy.end),
              )
            : [],
        },
      ];
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** First conflicting session, else next upcoming session, else first session, else class start. */
function resolveInitialDate(
  entries: WeekEntry[],
  item: OpenEnrollmentClass,
  today: Date,
): Date {
  const pick =
    entries.find((entry) => entry.conflicts.length > 0 && entry.end >= today) ??
    entries.find((entry) => entry.end >= today) ??
    entries[0];
  if (pick) return pick.start;

  return parseApiDateTime(item.startDate) ?? today;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTimeRange(start: Date, end: Date): string {
  return `${TIME_FORMATTER.format(start)}–${TIME_FORMATTER.format(end)}`;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEndDay = addDays(weekStart, 6);
  return `${weekStart.getDate()}/${weekStart.getMonth() + 1} – ${weekEndDay.getDate()}/${weekEndDay.getMonth() + 1}/${weekEndDay.getFullYear()}`;
}
