"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Video,
} from "lucide-react";

import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useContainerNarrow } from "@/hooks/use-container-narrow";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getClassSessions,
  getClasses,
  getMyMentorProfile,
  type Class,
  type ClassSession,
  type ClassSessionKind,
  type ClassSessionStatus,
} from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";
import {
  CLASS_SESSION_STATUS_LABELS,
  CLASS_SESSIONS_QUERY,
} from "@/lib/classes/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  addDaysToDateOnly,
  addMonthsToYearMonth,
  formatDayColumnLabel,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMonthGridCells,
  getVietnamMondayOf,
  getVietnamYearMonth,
  getZonedDateParts,
  isSameMonthDateOnly,
  isTodayDateOnly,
  mondayOnOrBefore,
  SCHEDULE_TIMEZONE,
  toDateOnlyString,
} from "@/lib/schedules/week";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

type ScheduleViewMode = "week" | "month";

type ClassRef = Pick<Class, "id" | "name" | "code">;

type MentorScheduleItem = {
  id: string;
  classId: string;
  classCode: string;
  className: string;
  title: string;
  sessionKind: ClassSessionKind;
  startTime: string;
  endTime: string;
  location: string | null;
  meetingUrl: string | null;
  status: ClassSessionStatus;
  activityId: string | null;
  dateOnly: string;
};

type MentorScheduleDay = {
  date: string;
  sessions: MentorScheduleItem[];
};

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
const MONTH_MAX_CHIPS = 2;

const SESSION_KIND_LABELS: Record<ClassSessionKind, string> = {
  LiveOnline: "Buổi học",
  Offline: "Ngoại khóa",
  AssignmentWindow: "Nộp bài",
};

function formatSessionTimeRange(startTime: string, endTime: string): string {
  const start = parseApiDateTime(startTime);
  const end = parseApiDateTime(endTime);
  if (!start || !end) return "";
  const timeFmt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: SCHEDULE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}

function sessionDateOnly(startTime: string): string | null {
  const start = parseApiDateTime(startTime);
  if (!start) return null;
  const { year, month, day } = getZonedDateParts(start);
  return toDateOnlyString(year, month, day);
}

function toScheduleItem(
  session: ClassSession,
  classById: Map<string, ClassRef>,
): MentorScheduleItem | null {
  const dateOnly = sessionDateOnly(session.startTime);
  if (!dateOnly) return null;
  const cls = classById.get(session.classId);
  const className = cls?.name?.trim() || cls?.code || "Lớp";
  const classCode = cls?.code?.trim() || "";
  const title = session.title?.trim() || "Buổi học";
  return {
    id: session.id,
    classId: session.classId,
    classCode,
    className,
    title,
    sessionKind: session.sessionKind,
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
    meetingUrl: session.meetingUrl,
    status: session.status,
    activityId: session.activityId,
    dateOnly,
  };
}

function buildWeekDays(
  weekStart: string,
  sessions: MentorScheduleItem[],
): MentorScheduleDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDaysToDateOnly(weekStart, index);
    return {
      date,
      sessions: sessions
        .filter((session) => session.dateOnly === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  });
}

function SessionKindBadge({ kind }: { kind: ClassSessionKind }) {
  return (
    <Badge
      variant="secondary"
      className="rounded-md px-1.5 py-0 text-[10px] font-semibold"
    >
      {SESSION_KIND_LABELS[kind]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: ClassSessionStatus }) {
  const done = status === "Completed";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0 text-[10px] font-medium",
        done &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        status === "InProgress" &&
          "border-[#4FC3F7]/50 bg-[#4FC3F7]/15 text-[#0277BD] dark:text-[#81D4FA]",
        status === "Cancelled" && "border-border text-muted-foreground line-through",
      )}
    >
      {CLASS_SESSION_STATUS_LABELS[status]}
    </Badge>
  );
}

function SessionCard({
  session,
  compact,
  onOpen,
}: {
  session: MentorScheduleItem;
  compact?: boolean;
  onOpen: (session: MentorScheduleItem) => void;
}) {
  const timeRange = formatSessionTimeRange(session.startTime, session.endTime);
  const done = session.status === "Completed";
  const live = session.status === "InProgress";

  return (
    <button
      type="button"
      onClick={() => onOpen(session)}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border text-left",
        "bg-card shadow-sm",
        "transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "active:translate-y-0",
        live &&
          "border-[#4FC3F7] bg-[#4FC3F7]/10 shadow-[0_0_0_1px_rgba(79,195,247,0.25)] dark:bg-[#4FC3F7]/15",
        !live &&
          done &&
          "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15",
        !live && !done && "border-border",
        compact ? "p-2.5 pl-3.5" : "p-3.5 pl-4",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          live && "bg-[#4FC3F7]",
          !live && done && "bg-emerald-400",
          !live && !done && "bg-[#FDD835]",
        )}
      />

      <p
        className={cn(
          "font-mono font-bold tabular-nums tracking-tight text-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {timeRange}
      </p>
      <p
        className={cn(
          "mt-1 font-heading font-bold leading-snug text-foreground",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {session.className}
      </p>
      {session.classCode ? (
        <p className="mt-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          {session.classCode}
        </p>
      ) : null}
      <p
        className={cn(
          "mt-1 line-clamp-2 text-muted-foreground",
          compact ? "text-[10px]" : "text-xs",
        )}
      >
        {session.title}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={session.status} />
        <SessionKindBadge kind={session.sessionKind} />
      </div>

      {session.meetingUrl ? (
        <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#0288D1] dark:text-[#4FC3F7]">
          <Video className="size-3 shrink-0" aria-hidden />
          Online
        </p>
      ) : session.location ? (
        <p className="mt-2 flex items-start gap-1 text-[10px] font-medium text-muted-foreground">
          <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span className="line-clamp-2">{session.location}</span>
        </p>
      ) : null}
    </button>
  );
}

function DayColumn({
  day,
  onOpen,
  isFirst,
  isLast,
}: {
  day: MentorScheduleDay;
  onOpen: (session: MentorScheduleItem) => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const { weekday, dayMonth } = formatDayColumnLabel(day.date);
  const isToday = isTodayDateOnly(day.date);
  const sessionCount = day.sessions.length;
  const hasSessions = sessionCount > 0;

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
          "border-b px-2 py-3 text-center xl:px-3",
          isToday
            ? "border-primary/25 bg-primary text-primary-foreground"
            : "border-border bg-muted",
          isFirst && "rounded-tl-2xl",
          isLast && "rounded-tr-2xl",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.14em]",
            isToday ? "text-primary-foreground/90" : "text-muted-foreground",
          )}
        >
          {weekday}
        </p>
        <p
          className={cn(
            "mt-0.5 font-heading text-base font-bold tabular-nums",
            isToday ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {dayMonth}
        </p>
        {isToday ? (
          <span className="mt-1 inline-flex rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
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
          <p className="m-auto px-1 py-8 text-center text-[11px] font-medium text-muted-foreground/80">
            Không có buổi dạy
          </p>
        ) : (
          day.sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              compact
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MonthScheduleGrid({
  year,
  month,
  daysByDate,
  selectedDay,
  onSelectDay,
  onOpen,
}: {
  year: number;
  month: number;
  daysByDate: Map<string, MentorScheduleDay>;
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
  onOpen: (session: MentorScheduleItem) => void;
}) {
  const cells = useMemo(
    () => getMonthGridCells(year, month),
    [year, month],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-muted/60">
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:py-2"
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
              tabIndex={0}
              onClick={() => onSelectDay(date)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDay(date);
                }
              }}
              className={cn(
                "flex min-h-[3.25rem] flex-col border-b border-l border-border p-0.5 text-left transition-colors sm:min-h-[4.25rem] sm:p-1",
                !inMonth && "bg-muted/40",
                inMonth && "cursor-pointer bg-card hover:bg-primary/5",
                selected && "bg-primary/10 ring-1 ring-inset ring-primary/35",
                today && inMonth && !selected && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "mb-0.5 ml-auto flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums sm:size-6 sm:text-[11px]",
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
              <div className="flex min-h-0 flex-1 flex-col gap-px">
                {visible.map((session) => {
                  const time = formatSessionTimeRange(
                    session.startTime,
                    session.endTime,
                  ).split(" – ")[0];
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(session);
                      }}
                      title={`${session.className} · ${formatSessionTimeRange(session.startTime, session.endTime)}`}
                      className={cn(
                        "block w-full truncate rounded px-1 py-px text-left text-[8px] font-semibold leading-tight sm:text-[9px]",
                        "bg-foreground/6 text-foreground hover:bg-primary/15 hover:text-primary",
                        session.status === "Cancelled" &&
                          "opacity-50 line-through",
                      )}
                    >
                      <span className="font-mono tabular-nums">{time}</span>
                      <span className="hidden sm:inline">
                        {" "}
                        · {session.classCode || session.className}
                      </span>
                    </button>
                  );
                })}
                {overflow > 0 ? (
                  <span className="px-1 text-[8px] font-semibold text-muted-foreground sm:text-[9px]">
                    +{overflow} buổi
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleSkeleton({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="min-h-[22rem] border-r border-border p-2 last:border-r-0">
            <Skeleton className="mb-3 h-16 w-full rounded-lg" />
            <Skeleton className="mb-2 h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MentorScheduleOverview() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const scheduleAreaRef = useRef<HTMLDivElement>(null);
  /** Sidebar / inset narrows content — switch week grid to day tabs below this width. */
  const isContentNarrow = useContainerNarrow(scheduleAreaRef, 1100);
  const useCompactWeek = isMobile || isContentNarrow;
  const [classFilter, setClassFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("week");
  const [weekStart, setWeekStart] = useState(() => getVietnamMondayOf());
  const [monthCursor, setMonthCursor] = useState(getVietnamYearMonth);
  const [mobileDay, setMobileDay] = useState<string | null>(null);
  const [monthSelectedDay, setMonthSelectedDay] = useState<string | null>(null);

  const { data: mentorProfile, isLoading: isMentorLoading } = useClientFetch({
    fetcher: async () => {
      const result = await getMyMentorProfile();
      return result?.data ?? null;
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.detail"),
  });

  const mentorId = mentorProfile?.id ?? null;

  const { data: classesData, isLoading: isClassesLoading } = useClientFetch({
    enabled: mentorId != null,
    fetcher: async () => {
      if (!mentorId) return [];
      const result = await getClasses({
        mentorId,
        page: 1,
        pageSize: 100,
        sortBy: "startDate",
        isDescending: false,
      });
      return result?.data?.items ?? [];
    },
    deps: [mentorId],
    onError: (error) => showAppErrorFromUnknown(error, "classes.list"),
  });

  const classes = classesData ?? [];
  const classIdsKey = classes.map((c) => c.id).join(",");

  const { data: sessionsData, isLoading: isSessionsLoading } = useClientFetch({
    enabled: classIdsKey.length > 0,
    fetcher: async (): Promise<ClassSession[]> => {
      const results = await Promise.all(
        classes.map(async (cls) => {
          try {
            const result = await getClassSessions(cls.id, {
              ...CLASS_SESSIONS_QUERY,
            });
            return result?.data?.items ?? [];
          } catch {
            return [] as ClassSession[];
          }
        }),
      );
      return results.flat();
    },
    deps: [classIdsKey],
    onError: (error) => showAppErrorFromUnknown(error, "classSessions.list"),
  });

  const classById = useMemo(() => {
    const map = new Map<string, ClassRef>();
    for (const cls of classes) {
      map.set(cls.id, { id: cls.id, name: cls.name, code: cls.code });
    }
    return map;
  }, [classes]);

  const allItems = useMemo(() => {
    const items: MentorScheduleItem[] = [];
    for (const session of sessionsData ?? []) {
      const item = toScheduleItem(session, classById);
      if (item) items.push(item);
    }
    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [sessionsData, classById]);

  const filteredItems = useMemo(() => {
    if (classFilter === "all") return allItems;
    return allItems.filter((item) => item.classId === classFilter);
  }, [allItems, classFilter]);

  const weekEnd = addDaysToDateOnly(weekStart, 6);
  const weekDays = useMemo(
    () => buildWeekDays(weekStart, filteredItems),
    [weekStart, filteredItems],
  );
  const weekHasSessions = weekDays.some((day) => day.sessions.length > 0);

  const monthDaysByDate = useMemo(() => {
    const cells = getMonthGridCells(monthCursor.year, monthCursor.month);
    const map = new Map<string, MentorScheduleDay>();
    for (const date of cells) {
      map.set(date, {
        date,
        sessions: filteredItems
          .filter((item) => item.dateOnly === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      });
    }
    return map;
  }, [filteredItems, monthCursor.year, monthCursor.month]);

  const monthHasSessions = useMemo(() => {
    for (const day of monthDaysByDate.values()) {
      if (
        isSameMonthDateOnly(day.date, monthCursor.year, monthCursor.month) &&
        day.sessions.length > 0
      ) {
        return true;
      }
    }
    return false;
  }, [monthDaysByDate, monthCursor.year, monthCursor.month]);

  useEffect(() => {
    if (viewMode !== "week" || !weekDays.length) return;
    const today = weekDays.find((day) => isTodayDateOnly(day.date));
    setMobileDay((prev) => {
      if (prev && weekDays.some((day) => day.date === prev)) return prev;
      return today?.date ?? weekDays[0]?.date ?? null;
    });
  }, [weekDays, viewMode]);

  useEffect(() => {
    if (viewMode !== "month") return;
    setMonthSelectedDay((prev) => {
      if (
        prev &&
        isSameMonthDateOnly(prev, monthCursor.year, monthCursor.month)
      ) {
        return prev;
      }
      const cells = getMonthGridCells(monthCursor.year, monthCursor.month);
      const todayCell = cells.find(
        (date) =>
          isTodayDateOnly(date) &&
          isSameMonthDateOnly(date, monthCursor.year, monthCursor.month),
      );
      if (todayCell) return todayCell;
      return (
        cells.find((date) =>
          isSameMonthDateOnly(date, monthCursor.year, monthCursor.month),
        ) ?? null
      );
    });
  }, [monthCursor.year, monthCursor.month, viewMode]);

  const activeMobileDay = useMemo(
    () => weekDays.find((day) => day.date === mobileDay) ?? weekDays[0] ?? null,
    [weekDays, mobileDay],
  );

  const isLoading =
    isMentorLoading ||
    isClassesLoading ||
    (classIdsKey.length > 0 && isSessionsLoading);

  const selectedClassLabel =
    classFilter === "all"
      ? "Tất cả lớp"
      : classById.get(classFilter)?.name ||
        classById.get(classFilter)?.code ||
        "Lớp";

  const rangeLabel =
    viewMode === "week"
      ? formatWeekRangeLabel(weekStart, weekEnd)
      : formatMonthLabel(monthCursor.year, monthCursor.month);

  function goPrev() {
    if (viewMode === "week") {
      setWeekStart(addDaysToDateOnly(weekStart, -7));
      return;
    }
    setMonthCursor((prev) => addMonthsToYearMonth(prev.year, prev.month, -1));
  }

  function goNext() {
    if (viewMode === "week") {
      setWeekStart(addDaysToDateOnly(weekStart, 7));
      return;
    }
    setMonthCursor((prev) => addMonthsToYearMonth(prev.year, prev.month, 1));
  }

  function goToday() {
    if (viewMode === "week") {
      setWeekStart(getVietnamMondayOf());
      return;
    }
    setMonthCursor(getVietnamYearMonth());
  }

  function switchView(next: ScheduleViewMode) {
    if (next === viewMode) return;
    if (next === "month") {
      const [y, m] = weekStart.split("-").map(Number);
      if (y && m) setMonthCursor({ year: y, month: m });
    } else {
      const today = getVietnamYearMonth();
      if (
        monthCursor.year === today.year &&
        monthCursor.month === today.month
      ) {
        setWeekStart(getVietnamMondayOf());
      } else {
        setWeekStart(
          mondayOnOrBefore(
            toDateOnlyString(monthCursor.year, monthCursor.month, 1),
          ),
        );
      }
    }
    setViewMode(next);
  }

  function openSession(session: MentorScheduleItem) {
    const params = new URLSearchParams({ tab: "curriculum" });
    if (session.activityId) params.set("activityId", session.activityId);
    params.set("sessionId", session.id);
    router.push(`/mentor/classes/${session.classId}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Lịch dạy"
        description="Thời khóa biểu theo tuần hoặc tháng của các lớp bạn phụ trách."
      />

      <div ref={scheduleAreaRef} className="space-y-4 px-6 pb-12">
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="size-4 text-primary" />
              Lịch tổng hợp
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isLoading
                ? "Đang tải…"
                : `${filteredItems.length} buổi · ${classes.length} lớp`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={classFilter}
              onValueChange={(value) => setClassFilter(value ?? "all")}
              disabled={classes.length === 0}
            >
              <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "min-w-[12rem]")}>
                <span className="truncate">{selectedClassLabel}</span>
              </SelectTrigger>
              <SelectContent
                align="end"
                alignItemWithTrigger={false}
                sideOffset={8}
                className={THEME_SELECT_CONTENT}
              >
                <SelectItem value="all" className={THEME_SELECT_ITEM}>
                  Tất cả lớp
                </SelectItem>
                {classes.map((cls) => (
                  <SelectItem
                    key={cls.id}
                    value={cls.id}
                    className={THEME_SELECT_ITEM}
                  >
                    {cls.name || cls.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {classFilter !== "all" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`/mentor/classes/${classFilter}?tab=lich-hoc`} />
                }
                className="h-9 gap-1.5 rounded-lg"
              >
                <ExternalLink className="size-3.5" />
                Chi tiết lớp
              </Button>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="inline-flex h-9 self-start rounded-xl border border-border bg-card p-0.5"
            role="group"
            aria-label="Chế độ xem lịch"
          >
            <button
              type="button"
              onClick={() => switchView("week")}
              className={cn(
                "rounded-[10px] px-3.5 text-sm font-semibold transition-colors",
                viewMode === "week"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => switchView("month")}
              className={cn(
                "rounded-[10px] px-3.5 text-sm font-semibold transition-colors",
                viewMode === "month"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tháng
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-xl"
              onClick={goPrev}
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
              onClick={goNext}
              aria-label={viewMode === "week" ? "Tuần sau" : "Tháng sau"}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl px-3 text-sm font-semibold"
              onClick={goToday}
            >
              Hôm nay
            </Button>
          </div>
        </div>

        {isLoading ? (
          <ScheduleSkeleton mobile={useCompactWeek} />
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <ManagerEmptyState
              title="Chưa có lớp phụ trách"
              description="Khi bạn được gán vào lớp, lịch buổi dạy sẽ hiện ở đây."
              icon={CalendarDays}
              actionLabel="Xem danh sách lớp"
              onAction={() => router.push("/mentor/classes")}
            />
          </div>
        ) : viewMode === "month" ? (
          !monthHasSessions ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
              <CalendarDays className="mx-auto size-9 text-muted-foreground" />
              <p className="mt-3 font-heading text-lg font-semibold text-foreground">
                Tháng này chưa có lịch dạy
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Chuyển sang tháng khác, hoặc kiểm tra lịch từng lớp.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <MonthScheduleGrid
                year={monthCursor.year}
                month={monthCursor.month}
                daysByDate={monthDaysByDate}
                selectedDay={monthSelectedDay}
                onSelectDay={setMonthSelectedDay}
                onOpen={openSession}
              />
            </div>
          )
        ) : !weekHasSessions ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <CalendarDays className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-heading text-lg font-semibold text-foreground">
              Tuần này chưa có lịch dạy
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {classFilter === "all"
                ? "Chuyển sang tuần khác, hoặc kiểm tra lịch từng lớp."
                : "Lớp này không có buổi dạy trong tuần đang xem."}
            </p>
          </div>
        ) : useCompactWeek ? (
          <Tabs
            value={activeMobileDay?.date ?? undefined}
            onValueChange={setMobileDay}
            className="gap-4"
          >
            <TabsList className="flex h-auto w-full gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm">
              {weekDays.map((day, index) => {
                const { weekday } = formatDayColumnLabel(day.date);
                const today = isTodayDateOnly(day.date);
                return (
                  <TabsTrigger
                    key={day.date}
                    value={day.date}
                    className={cn(
                      "h-auto flex-1 rounded-none border-0 px-1 py-2.5 text-[11px] shadow-none after:hidden",
                      "data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none",
                      index > 0 && "border-l border-border",
                      today &&
                        "bg-primary/10 font-bold text-primary data-active:bg-primary data-active:text-primary-foreground",
                    )}
                  >
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="font-bold uppercase tracking-wide">
                        {weekday}
                      </span>
                      {day.sessions.length > 0 ? (
                        <span
                          className="size-1.5 rounded-full bg-primary"
                          aria-label={`${day.sessions.length} buổi`}
                        />
                      ) : (
                        <span className="h-1.5" aria-hidden />
                      )}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {weekDays.map((day) => (
              <TabsContent key={day.date} value={day.date} className="mt-0">
                <div className="space-y-2">
                  {day.sessions.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      Không có buổi dạy
                    </p>
                  ) : (
                    day.sessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onOpen={openSession}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid min-h-[calc(100dvh-18rem)] grid-cols-7 sm:min-h-[calc(100dvh-20rem)]">
              {weekDays.map((day, index) => (
                <DayColumn
                  key={day.date}
                  day={day}
                  onOpen={openSession}
                  isFirst={index === 0}
                  isLast={index === weekDays.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
