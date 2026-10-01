"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogScrollBody,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StudentScheduleInterval } from "@/lib/api";
import type { ClassSessionKind } from "@/lib/api/entities/class-session";
import { parseApiDateTime } from "@/lib/api/datetime";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import {
  getConflictingBusyIds,
  getConflictingSessionIds,
  overlaps,
} from "@/lib/classes/schedule-conflict";
import { cn } from "@/lib/utils";

export type WeekScheduleSession = {
  sessionId: string;
  title: string | null;
  startTime: string;
  endTime: string;
  sessionKind?: ClassSessionKind | null;
  status?: string | null;
};

/** Class identity plus its sessions — student recruiting classes and mentor board classes. */
export type WeekScheduleClass = {
  classId: string;
  code: string | null;
  name: string | null;
  mentorName: string | null;
  startDate: string;
  sessions: WeekScheduleSession[];
};

type OpenClassWeekDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WeekScheduleClass;
  /** Occupied intervals; `null` when conflicts can't be checked. */
  busyIntervals: StudentScheduleInterval[] | null;
};

/** Compact week view of a recruiting class; days clashing with the student's schedule are flagged. */
export function OpenClassWeekDialog({
  open,
  onOpenChange,
  item,
  busyIntervals,
}: OpenClassWeekDialogProps) {
  const classCode = item.code?.trim() || "";
  const className = item.name?.trim() || "Lớp tuyển sinh";
  const mentorName = item.mentorName?.trim() || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollPopup className="max-w-xl">
        <DialogScrollHeader className="space-y-1">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
            <CalendarDays className="size-3.5 shrink-0 text-[#0288D1]" aria-hidden />
            {classCode || "Lịch học"}
          </p>
          <DialogTitle className="text-lg leading-snug">{className}</DialogTitle>
          {mentorName ? (
            <DialogDescription>Mentor {mentorName}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Lịch các buổi của lớp
            </DialogDescription>
          )}
          <DialogClose />
        </DialogScrollHeader>
        <DialogScrollBody className="pt-4">
          <WeekSchedule item={item} busyIntervals={busyIntervals} />
        </DialogScrollBody>
      </DialogScrollPopup>
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

  const weekEnd = addDays(weekStart, 7);
  const weekEntries = entries.filter(
    (entry) => entry.start >= weekStart && entry.start < weekEnd,
  );

  const conflictCount = weekEntries.filter(
    (entry) => entry.conflicts.length > 0,
  ).length;

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
        {conflictCount > 0 ? (
          <p className="rounded-md bg-[#FFF0EE] px-2 py-1 text-xs font-semibold text-[#a82a1e]">
            {conflictCount} buổi trùng lịch
          </p>
        ) : null}
      </div>

      {weekEntries.length === 0 ? (
        <p className="border-t border-[#E5E5E0] pt-3 text-center text-sm text-[#6B6B6B]">
          {entries.length === 0
            ? "Lớp chưa có buổi học trên lịch."
            : "Tuần này không có buổi học."}
        </p>
      ) : (
        <ul className="space-y-2 border-t border-[#E5E5E0] pt-3">
          {weekEntries.map((entry) => (
            <WeekEntryRow
              key={entry.key}
              entry={entry}
              isToday={isSameDay(entry.start, today)}
            />
          ))}
        </ul>
      )}
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
  children: ReactNode;
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

function WeekEntryRow({
  entry,
  isToday,
}: {
  entry: WeekEntry;
  isToday: boolean;
}) {
  const timeLabel = entry.isWindow
    ? CLASS_SESSION_KIND_LABELS.AssignmentWindow
    : formatTimeRange(entry.start, entry.end);
  const hasConflict = entry.conflicts.length > 0;
  const weekday = WEEKDAY_LABELS[(entry.start.getDay() + 6) % 7];
  const dateLabel = `${entry.start.getDate()}/${entry.start.getMonth() + 1}`;

  return (
    <li
      className={cn(
        "rounded-xl border px-3 py-2.5",
        hasConflict
          ? "border-[#E94B3C]/30 bg-[#FFF0EE]"
          : "border-[#4FC3F7]/50 bg-[#E8F7FD]",
      )}
    >
      <div className="grid grid-cols-[4.75rem_auto] items-baseline gap-x-3 sm:grid-cols-[4.75rem_auto_minmax(0,1fr)]">
        <p className="text-sm font-semibold text-[#6B6B6B]">
          {weekday}{" "}
          <span
            className={cn(
              "tabular-nums text-[#2D2D2D]",
              isToday && "rounded-md bg-[#0288D1] px-1 text-white",
            )}
          >
            {dateLabel}
          </span>
        </p>
        <p className="text-sm font-semibold tabular-nums text-[#2D2D2D]">
          {timeLabel}
        </p>
        <p className="col-span-2 mt-0.5 text-sm text-[#2D2D2D] sm:col-span-1 sm:mt-0 sm:truncate">
          {entry.title}
        </p>
      </div>
      {hasConflict ? (
        <ul className="mt-1.5 space-y-0.5">
          {entry.conflicts.map((conflict, index) => (
            <li
              key={`${conflict.classLabel}-${conflict.start.toISOString()}-${index}`}
              className="text-xs leading-snug text-[#a82a1e]"
            >
              Trùng với {conflict.classLabel}
              {" · "}
              {formatTimeRange(conflict.start, conflict.end)}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
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
  item: WeekScheduleClass,
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
  item: WeekScheduleClass,
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
