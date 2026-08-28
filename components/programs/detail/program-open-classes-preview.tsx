"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";

import { SeatHoldCountdown } from "@/components/payment/seat-hold-countdown";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProgramOpenClasses } from "@/hooks/use-program-open-classes";
import {
  getMySchedule,
  type OpenEnrollmentClass,
  type OpenEnrollmentClassSession,
  type StudentScheduleInterval,
} from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";
import { isStudentRole } from "@/lib/auth/roles";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import {
  findBusyConflictLabel,
  getConflictingSessionIds,
  overlaps,
} from "@/lib/classes/schedule-conflict";
import {
  addDaysToDateOnly,
  formatDayColumnLabel,
  formatVietnamTimeRange,
  formatWeekRangeLabel,
  getVietnamMondayOf,
  getZonedDateParts,
  toDateOnlyString,
} from "@/lib/schedules/week";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { useProgramSelectedClass } from "./program-selected-class-context";

type ProgramOpenClassesPreviewProps = {
  programId: string;
  /** Notifies parent when open seats availability changes (for pay gate). */
  onAvailabilityChange?: (hasOpenSeats: boolean, isLoading: boolean) => void;
  className?: string;
};

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

function formatClassDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  try {
    return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
  } catch {
    return `${startDate} – ${endDate}`;
  }
}

function sessionDateOnly(value: string): string | null {
  const date = parseApiDateTime(value);
  if (!date) return null;
  const parts = getZonedDateParts(date);
  return toDateOnlyString(parts.year, parts.month, parts.day);
}

function weekMondaysFromSessions(
  sessions: OpenEnrollmentClassSession[],
): string[] {
  const set = new Set<string>();
  for (const session of sessions) {
    const date = parseApiDateTime(session.startTime);
    if (!date) continue;
    set.add(getVietnamMondayOf(date));
  }
  return [...set].sort();
}

function OpenClassCard({
  item,
  isSelected,
  isSelecting,
  hasValidHold,
  conflictLabel,
  busyIntervals,
  onSelect,
}: {
  item: OpenEnrollmentClass;
  isSelected: boolean;
  isSelecting: boolean;
  hasValidHold: boolean;
  conflictLabel: string | null;
  busyIntervals: StudentScheduleInterval[];
  onSelect: () => void;
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const noSeats = item.seatsRemaining <= 0;
  const isDisabled = noSeats || isSelecting || conflictLabel != null;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        conflictLabel
          ? "border-[#E94B3C]/45 bg-[#FFF8F7]"
          : isSelected
            ? "border-[#4FC3F7] bg-[#E8F7FD] ring-2 ring-[#4FC3F7]/25"
            : "border-[#E5E5E0] bg-white hover:border-[#D4D4CF] hover:bg-[#FAFAF5]",
        isSelected && conflictLabel && "ring-2 ring-[#E94B3C]/20",
      )}
    >
      <button
        type="button"
        className={cn(
          "w-full text-left",
          isDisabled && "cursor-not-allowed opacity-70",
        )}
        aria-pressed={isSelected}
        disabled={isDisabled}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
              {item.code?.trim() || item.classId.slice(0, 8)}
            </p>
            <p className="mt-1 font-heading text-base font-semibold text-[#2D2D2D]">
              {item.name?.trim() || "Lớp tuyển sinh"}
            </p>
            {item.mentorName?.trim() ? (
              <p className="mt-1 text-xs text-[#6B6B6B]">
                Mentor · {item.mentorName.trim()}
              </p>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-[#7CB342]/35 bg-[#F1F8E9] text-[#558B2F]"
          >
            <Users className="mr-1 size-3" aria-hidden />
            Còn {item.seatsRemaining}/{item.maxCapacity}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#6B6B6B]">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {item.scheduleSummary?.trim() ||
                formatClassDateRange(item.startDate, item.endDate)}
            </span>
          </span>
        </div>
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        {conflictLabel ? (
          <p className="inline-flex flex-1 items-start gap-1.5 rounded-lg border border-[#E94B3C]/25 bg-[#FFF0EE] px-2.5 py-1.5 text-[11px] font-medium text-[#a82a1e]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {conflictLabel}
          </p>
        ) : isSelecting ? (
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0288D1]">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Đang giữ ghế…
          </p>
        ) : isSelected && hasValidHold ? (
          <p className="text-[11px] font-medium text-[#0288D1]">
            Đã chọn · ghế đang giữ
          </p>
        ) : isSelected ? (
          <p className="text-[11px] font-medium text-[#6B6B6B]">
            Đã chọn · đăng nhập để giữ ghế
          </p>
        ) : null}

        <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#0288D1] hover:underline"
                aria-label={`Xem thời khóa biểu lớp ${item.name?.trim() || item.code || ""}`}
              >
                TKB
                <ChevronRight className="size-3.5" aria-hidden />
              </button>
            }
          />
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            className="w-[min(40rem,calc(100vw-1.25rem))] gap-0 overflow-hidden rounded-xl border border-[#E5E5E0] bg-white p-0 text-[#2D2D2D] shadow-[0_8px_28px_rgba(45,45,45,0.12)] ring-0"
          >
            <ClassTimetablePanel
              item={item}
              busyIntervals={busyIntervals}
              conflictLabel={conflictLabel}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function ClassTimetablePanel({
  item,
  busyIntervals,
  conflictLabel,
}: {
  item: OpenEnrollmentClass;
  busyIntervals: StudentScheduleInterval[];
  conflictLabel: string | null;
}) {
  const weekOptions = useMemo(
    () => weekMondaysFromSessions(item.sessions),
    [item.sessions],
  );

  const [weekStart, setWeekStart] = useState(
    () => weekOptions[0] ?? getVietnamMondayOf(),
  );

  useEffect(() => {
    if (weekOptions.length === 0) return;
    if (!weekOptions.includes(weekStart)) {
      setWeekStart(weekOptions[0]!);
    }
  }, [weekOptions, weekStart]);

  const weekEnd = addDaysToDateOnly(weekStart, 6);
  const weekIndex = weekOptions.indexOf(weekStart);
  const canPrev = weekIndex > 0;
  const canNext = weekIndex >= 0 && weekIndex < weekOptions.length - 1;

  const conflictingIds = useMemo(
    () =>
      getConflictingSessionIds(item.sessions, busyIntervals, {
        excludeClassId: item.classId,
      }),
    [busyIntervals, item.classId, item.sessions],
  );

  const dayColumns = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const dateOnly = addDaysToDateOnly(weekStart, index);
      const label = formatDayColumnLabel(dateOnly);
      const sessions = item.sessions
        .filter((session) => sessionDateOnly(session.startTime) === dateOnly)
        .sort((a, b) => {
          const aTime = parseApiDateTime(a.startTime)?.getTime() ?? 0;
          const bTime = parseApiDateTime(b.startTime)?.getTime() ?? 0;
          return aTime - bTime;
        });

      const busyOnDay = busyIntervals.filter((busy) => {
        if (busy.status === "Cancelled") return false;
        if (busy.classId === item.classId) return false;
        return sessionDateOnly(busy.startTime) === dateOnly;
      });

      return { dateOnly, label, sessions, busyOnDay, weekday: WEEKDAY_SHORT[index]! };
    });
  }, [busyIntervals, item.classId, item.sessions, weekStart]);

  return (
    <>
      <div className="border-b border-[#E5E5E0] bg-[#FAFAF5] px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold">
              Thời khóa biểu · {item.name?.trim() || "Tuyển sinh"}
            </p>
            <p className="mt-0.5 text-[11px] text-[#6B6B6B]">
              {item.scheduleSummary?.trim() ||
                formatClassDateRange(item.startDate, item.endDate)}
            </p>
          </div>
          {weekOptions.length > 0 ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md border border-[#E5E5E0] bg-white text-[#2D2D2D] disabled:opacity-40"
                disabled={!canPrev}
                aria-label="Tuần trước"
                onClick={() => {
                  if (!canPrev) return;
                  setWeekStart(weekOptions[weekIndex - 1]!);
                }}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="min-w-[7.5rem] text-center font-mono text-[11px] font-semibold tabular-nums text-[#6B6B6B]">
                {formatWeekRangeLabel(weekStart, weekEnd)}
              </span>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md border border-[#E5E5E0] bg-white text-[#2D2D2D] disabled:opacity-40"
                disabled={!canNext}
                aria-label="Tuần sau"
                onClick={() => {
                  if (!canNext) return;
                  setWeekStart(weekOptions[weekIndex + 1]!);
                }}
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>

        {conflictLabel ? (
          <p className="mt-2 inline-flex w-full items-start gap-1.5 rounded-lg border border-[#E94B3C]/25 bg-[#FFF0EE] px-2.5 py-1.5 text-[11px] font-medium text-[#a82a1e]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {conflictLabel}
          </p>
        ) : null}
      </div>

      {item.sessions.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-[#6B6B6B]">
          Chưa có buổi học trên lịch lớp.
        </p>
      ) : (
        <div className="overflow-x-auto px-2.5 py-2.5">
          <div className="grid min-w-[34rem] grid-cols-7 gap-1.5">
            {dayColumns.map((day) => (
              <div key={day.dateOnly} className="min-w-0">
                <div className="mb-1.5 rounded-md bg-[#FAFAF5] px-1 py-1.5 text-center">
                  <p className="font-mono text-[10px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
                    {day.weekday}
                  </p>
                  <p className="text-[10px] text-[#6B6B6B]">{day.label.dayMonth}</p>
                </div>
                <ul className="min-h-24 space-y-1">
                  {day.sessions.map((session) => {
                    const isConflict = conflictingIds.has(session.sessionId);
                    return (
                      <li key={session.sessionId}>
                        <TimetableSessionChip
                          session={session}
                          isConflict={isConflict}
                        />
                      </li>
                    );
                  })}
                  {day.busyOnDay.map((busy) => {
                    const hitsClassSession = day.sessions.some((session) => {
                      const cStart = parseApiDateTime(session.startTime);
                      const cEnd = parseApiDateTime(session.endTime);
                      const bStart = parseApiDateTime(busy.startTime);
                      const bEnd = parseApiDateTime(busy.endTime);
                      if (!cStart || !cEnd || !bStart || !bEnd) return false;
                      return overlaps(cStart, cEnd, bStart, bEnd);
                    });
                    if (!hitsClassSession) return null;
                    return (
                      <li key={busy.classSessionId}>
                        <div className="rounded-md border border-dashed border-[#E94B3C]/40 bg-[#FFF0EE]/70 px-1.5 py-1">
                          <p className="truncate text-[9px] font-semibold text-[#a82a1e]">
                            Lịch bạn ·{" "}
                            {busy.className?.trim() ||
                              busy.classCode?.trim() ||
                              "lớp khác"}
                          </p>
                          <p className="font-mono text-[9px] tabular-nums text-[#a82a1e]/90">
                            {formatVietnamTimeRange(busy.startTime, busy.endTime)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                  {day.sessions.length === 0 ? (
                    <li className="rounded-md border border-dashed border-[#E5E5E0] px-1 py-3 text-center text-[9px] text-[#B0B0A8]">
                      —
                    </li>
                  ) : null}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-[#E5E5E0] px-1 pt-2 text-[10px] text-[#6B6B6B]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#E8F7FD] ring-1 ring-[#4FC3F7]/50" />
              Buổi lớp này
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#FFF0EE] ring-1 ring-[#E94B3C]/45" />
              Trùng lịch
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function TimetableSessionChip({
  session,
  isConflict,
}: {
  session: OpenEnrollmentClassSession;
  isConflict: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-1.5 py-1",
        isConflict
          ? "border-[#E94B3C]/45 bg-[#FFF0EE]"
          : "border-[#4FC3F7]/35 bg-[#E8F7FD]",
      )}
    >
      <p
        className={cn(
          "truncate text-[9px] font-semibold leading-tight",
          isConflict ? "text-[#a82a1e]" : "text-[#0277BD]",
        )}
      >
        {session.title?.trim() || "Buổi học"}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-[9px] tabular-nums",
          isConflict ? "text-[#a82a1e]/90" : "text-[#0288D1]",
        )}
      >
        {formatVietnamTimeRange(session.startTime, session.endTime)}
      </p>
      <p className="mt-0.5 truncate text-[8px] text-[#6B6B6B]">
        {CLASS_SESSION_KIND_LABELS[session.sessionKind] ?? session.sessionKind}
        {session.location?.trim() ? (
          <>
            {" · "}
            <MapPin className="mr-0.5 inline size-2" aria-hidden />
            {session.location.trim()}
          </>
        ) : null}
      </p>
    </div>
  );
}

/** Pre-pay recruiting class list — select-class holds seat immediately. */
export function ProgramOpenClassesPreview({
  programId,
  onAvailabilityChange,
  className,
}: ProgramOpenClassesPreviewProps) {
  const { classes, isLoading, hasError, hasOpenSeats, refresh } =
    useProgramOpenClasses(programId);
  const {
    selectedClassId,
    holdExpiresAt,
    hasValidHold,
    isHoldExpired,
    selectingClassId,
    selectClass,
  } = useProgramSelectedClass();
  const { isAuthenticated, isHydrated, profile } = useCurrentUser();
  const isStudent =
    isHydrated && isAuthenticated && isStudentRole(profile?.role);

  const [busyIntervals, setBusyIntervals] = useState<StudentScheduleInterval[]>(
    [],
  );

  useEffect(() => {
    onAvailabilityChange?.(hasOpenSeats, isLoading);
  }, [hasOpenSeats, isLoading, onAvailabilityChange]);

  useEffect(() => {
    if (!isStudent) {
      setBusyIntervals([]);
      return;
    }
    let cancelled = false;
    void getMySchedule()
      .then((result) => {
        if (!cancelled) setBusyIntervals(result?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setBusyIntervals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isStudent]);

  const conflictByClassId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const item of classes) {
      map.set(
        item.classId,
        findBusyConflictLabel(item.sessions, busyIntervals, {
          excludeClassId: item.classId,
        }),
      );
    }
    return map;
  }, [busyIntervals, classes]);

  async function handleSelect(classId: string) {
    if (selectingClassId) return;
    if (hasValidHold && selectedClassId === classId) return;

    const item = classes.find((entry) => entry.classId === classId);
    if (!item || item.seatsRemaining <= 0) return;

    const conflict = conflictByClassId.get(classId);
    if (conflict) {
      showAppErrorFromUnknown(new Error(conflict), "programs.selectClass");
      return;
    }

    try {
      await selectClass(classId);
      await refresh(classId);
    } catch {
      await refresh(selectedClassId);
    }
  }

  return (
    <section
      className={cn("space-y-3", className)}
      aria-label="Lớp đang tuyển sinh"
    >
      <div>
        <h3 className="font-heading text-base font-semibold text-[#2D2D2D]">
          Lớp đang tuyển sinh
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[#6B6B6B]">
          Bấm chọn lớp để giữ ghế ngay (5 phút). Xem TKB từng lớp trước khi quyết
          định. Ghế/link hết hạn sau 5 phút — chọn lại nếu cần.
        </p>
        {hasValidHold && holdExpiresAt ? (
          <SeatHoldCountdown holdExpiresAt={holdExpiresAt} className="mt-2" />
        ) : isHoldExpired ? (
          <p className="mt-2 text-xs font-medium text-[#a82a1e]">
            Ghế đã hết hạn — chọn lại lớp để giữ ghế mới.
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28 w-full rounded-xl bg-[#E5E5E0]" />
          <Skeleton className="h-28 w-full rounded-xl bg-[#E5E5E0]" />
        </div>
      ) : hasError ? (
        <div className="rounded-xl border border-[#E5E5E0] bg-[#FAFAF5] px-4 py-5 text-center">
          <p className="text-sm text-[#6B6B6B]">
            Không tải được danh sách lớp. Thử lại sau.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[#0288D1] underline-offset-2 hover:underline"
            onClick={() => void refresh()}
          >
            Tải lại
          </button>
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-[#E94B3C]/25 bg-[#FFF0EE] px-4 py-5">
          <p className="text-sm font-medium text-[#a82a1e]">
            Hiện chưa có lớp Standard đang mở còn ghế.
          </p>
          <p className="mt-1 text-xs text-[#6B6B6B]">
            Đăng ký tạm khóa cho đến khi có lớp tuyển sinh còn chỗ.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {classes.map((item) => (
            <li key={item.classId}>
              <OpenClassCard
                item={item}
                isSelected={selectedClassId === item.classId}
                isSelecting={selectingClassId === item.classId}
                hasValidHold={
                  hasValidHold && selectedClassId === item.classId
                }
                conflictLabel={conflictByClassId.get(item.classId) ?? null}
                busyIntervals={busyIntervals}
                onSelect={() => void handleSelect(item.classId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
