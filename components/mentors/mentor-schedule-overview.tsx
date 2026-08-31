"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ExternalLink } from "lucide-react";

import {
  ScheduleDayColumn,
  ScheduleMobileWeekTabs,
  ScheduleMonthDayAgenda,
  ScheduleMonthGrid,
  ScheduleMonthSkeleton,
  ScheduleRangeNavigation,
  ScheduleWeekSkeleton,
  ViewModeSwitch,
  type ScheduleDayData,
  type ScheduleDisplaySession,
  type ScheduleViewMode,
} from "@/components/schedule/shared";
import { ScheduleSessionDetailSheet } from "@/components/schedule/schedule-session-detail-sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getClassSessions,
  getClasses,
  getMyMentorProfile,
  type Class,
  type ClassSession,
} from "@/lib/api";
import { parseApiDateTime } from "@/lib/api/datetime";
import { CLASS_SESSIONS_QUERY } from "@/lib/classes/constants";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  addDaysToDateOnly,
  addMonthsToYearMonth,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMonthGridCells,
  getVietnamMondayOf,
  getVietnamYearMonth,
  getZonedDateParts,
  isSameMonthDateOnly,
  isTodayDateOnly,
  mondayOnOrBefore,
  toDateOnlyString,
} from "@/lib/schedules/week";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

type ClassRef = Pick<Class, "id" | "name" | "code" | "programId">;

type MentorScheduleItem = ScheduleDisplaySession & {
  classId: string;
  programId: string | null;
  activityId: string | null;
  dateOnly: string;
};

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
    programId: cls?.programId ?? null,
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
): ScheduleDayData<MentorScheduleItem>[] {
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

export function MentorScheduleOverview() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [classFilter, setClassFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("week");
  const [weekStart, setWeekStart] = useState(() => getVietnamMondayOf());
  const [monthCursor, setMonthCursor] = useState(getVietnamYearMonth);
  const [mobileDay, setMobileDay] = useState<string | null>(null);
  const [monthSelectedDay, setMonthSelectedDay] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<MentorScheduleItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
      map.set(cls.id, {
        id: cls.id,
        name: cls.name,
        code: cls.code,
        programId: cls.programId,
      });
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
    const map = new Map<string, ScheduleDayData<MentorScheduleItem>>();
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

  const sessionSummary = isLoading
    ? "Đang tải…"
    : `${filteredItems.length} buổi · ${classes.length} lớp`;

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
    setSelectedSession(session);
    setDetailOpen(true);
  }

  const detailSession = selectedSession
    ? {
        id: selectedSession.id,
        classId: selectedSession.classId,
        classCode: selectedSession.classCode ?? "",
        className: selectedSession.className,
        programId: selectedSession.programId,
        activityId: selectedSession.activityId,
        sessionKind: selectedSession.sessionKind,
        startTime: selectedSession.startTime,
        endTime: selectedSession.endTime,
        location: selectedSession.location,
        meetingUrl: selectedSession.meetingUrl,
        status: selectedSession.status,
        isCompleted: selectedSession.isCompleted,
        attendanceStatus: selectedSession.attendanceStatus,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 py-8 sm:px-5 sm:py-10 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Giảng viên
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Lịch dạy
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Thời khóa biểu theo tuần hoặc tháng của các lớp bạn phụ trách.
            {!isLoading ? ` ${sessionSummary}.` : ""}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select
              value={classFilter}
              onValueChange={(value) => setClassFilter(value ?? "all")}
              disabled={classes.length === 0}
            >
              <SelectTrigger
                className={cn(THEME_SELECT_TRIGGER, "min-w-[12rem]")}
              >
                <span className="truncate">{selectedClassLabel}</span>
              </SelectTrigger>
              <SelectContent
                align="start"
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
                className="h-9 gap-1.5 rounded-xl"
              >
                <ExternalLink className="size-3.5" />
                Chi tiết lớp
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <ViewModeSwitch value={viewMode} onChange={switchView} />
          <ScheduleRangeNavigation
            viewMode={viewMode}
            rangeLabel={rangeLabel}
            onPrev={goPrev}
            onNext={goNext}
            onToday={goToday}
          />
        </div>
      </div>

      {isLoading ? (
        viewMode === "month" ? (
          <ScheduleMonthSkeleton />
        ) : (
          <ScheduleWeekSkeleton mobile={Boolean(isMobile)} />
        )
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <CalendarDays className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-3 font-heading text-lg font-semibold text-foreground">
            Chưa có lớp phụ trách
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Khi bạn được gán vào lớp, lịch buổi dạy sẽ hiện ở đây.
          </p>
          <Button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "mt-5 rounded-xl")}
            onClick={() => router.push("/mentor/classes")}
          >
            Xem danh sách lớp
          </Button>
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
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
            <ScheduleMonthGrid
              year={monthCursor.year}
              month={monthCursor.month}
              daysByDate={monthDaysByDate}
              selectedDay={monthSelectedDay}
              onSelectDay={setMonthSelectedDay}
            />
            <ScheduleMonthDayAgenda
              date={monthSelectedDay}
              day={
                monthSelectedDay
                  ? monthDaysByDate.get(monthSelectedDay)
                  : undefined
              }
              onOpen={openSession}
              emptyLabel="Không có buổi dạy"
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
      ) : isMobile ? (
        <ScheduleMobileWeekTabs
          days={weekDays}
          activeDay={activeMobileDay?.date ?? null}
          onDayChange={setMobileDay}
          onOpen={openSession}
          emptyLabel="Không có buổi dạy"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid min-h-[28rem] grid-cols-7 lg:min-h-[32rem]">
            {weekDays.map((day, index) => (
              <ScheduleDayColumn
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
      <ScheduleSessionDetailSheet
        audience="mentor"
        session={detailSession}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
