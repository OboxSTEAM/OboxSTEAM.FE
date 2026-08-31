"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { ScheduleSessionDetailSheet } from "@/components/schedule/schedule-session-detail-sheet";
import {
  ScheduleDayColumn,
  ScheduleMobileWeekTabs,
  ScheduleMonthDayAgenda,
  ScheduleMonthGrid,
  ScheduleMonthSkeleton,
  ScheduleRangeNavigation,
  ScheduleWeekSkeleton,
  ViewModeSwitch,
  type ScheduleViewMode,
} from "@/components/schedule/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getWeeklySchedule,
  getMonthlyScheduleDays,
  type ScheduleDay,
  type ScheduleSession,
  type WeeklySchedule,
} from "@/lib/api/schedules";
import { isStudentRole } from "@/lib/auth/roles";
import { showAppErrorFromUnknown } from "@/lib/errors";
import {
  addDaysToDateOnly,
  addMonthsToYearMonth,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMonthGridCells,
  getVietnamMondayOf,
  getVietnamYearMonth,
  isMondayDateOnly,
  isSameMonthDateOnly,
  isTodayDateOnly,
  mondayOnOrBefore,
  toDateOnlyString,
} from "@/lib/schedules/week";
import { cn } from "@/lib/utils";

export function StudentWeeklySchedule() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { profile, isAuthenticated, isHydrated, isLoading } = useCurrentUser();

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("week");
  /** `null` = omit weekStart so BE uses current VN Monday. */
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(getVietnamYearMonth);
  const [selectedSession, setSelectedSession] =
    useState<ScheduleSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileDay, setMobileDay] = useState<string | null>(null);
  const [monthSelectedDay, setMonthSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login?returnUrl=%2Fschedule");
      return;
    }
    if (profile && !isStudentRole(profile.role)) {
      router.replace("/");
    }
  }, [isAuthenticated, isHydrated, isLoading, profile, router]);

  const canFetch =
    isHydrated && isAuthenticated && isStudentRole(profile?.role);

  const {
    data: weekData,
    isLoading: isWeekLoading,
    markLoading: markWeekLoading,
    retry: retryWeek,
    hasError: hasWeekError,
  } = useClientFetch({
    enabled: canFetch && viewMode === "week",
    fetcher: async (): Promise<WeeklySchedule> => {
      if (weekStart && !isMondayDateOnly(weekStart)) {
        throw new Error("Chọn ngày bắt đầu tuần (Thứ Hai)");
      }
      const result = await getWeeklySchedule({
        weekStart: weekStart ?? undefined,
      });
      return result.data;
    },
    deps: [weekStart],
    onError: (error) => showAppErrorFromUnknown(error, "schedule.weekly"),
  });

  const {
    data: monthDays,
    isLoading: isMonthLoading,
    markLoading: markMonthLoading,
    retry: retryMonth,
    hasError: hasMonthError,
  } = useClientFetch({
    enabled: canFetch && viewMode === "month",
    fetcher: async (): Promise<Map<string, ScheduleDay>> =>
      getMonthlyScheduleDays({
        year: monthCursor.year,
        month: monthCursor.month,
      }),
    deps: [monthCursor.year, monthCursor.month],
    onError: (error) => showAppErrorFromUnknown(error, "schedule.weekly"),
  });

  const days = weekData?.days ?? [];
  const resolvedWeekStart =
    weekData?.weekStart ?? weekStart ?? getVietnamMondayOf();
  const resolvedWeekEnd =
    weekData?.weekEnd ?? addDaysToDateOnly(resolvedWeekStart, 6);
  const weekHasSessions = days.some((day) => day.sessions.length > 0);

  const monthDaysByDate = monthDays ?? new Map<string, ScheduleDay>();
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

  const isScheduleLoading =
    viewMode === "week" ? isWeekLoading : isMonthLoading;
  const hasError = viewMode === "week" ? hasWeekError : hasMonthError;

  useEffect(() => {
    if (viewMode !== "week" || !days.length) return;
    const today = days.find((day) => isTodayDateOnly(day.date));
    setMobileDay((prev) => {
      if (prev && days.some((day) => day.date === prev)) return prev;
      return today?.date ?? days[0]?.date ?? null;
    });
  }, [days, viewMode]);

  useEffect(() => {
    if (viewMode !== "month" || !monthDays) return;
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
  }, [monthDays, monthCursor.year, monthCursor.month, viewMode]);

  const activeMobileDay = useMemo(
    () => days.find((day) => day.date === mobileDay) ?? days[0] ?? null,
    [days, mobileDay],
  );

  function markLoading() {
    if (viewMode === "week") markWeekLoading();
    else markMonthLoading();
  }

  function goPrev() {
    markLoading();
    if (viewMode === "week") {
      setWeekStart(addDaysToDateOnly(resolvedWeekStart, -7));
      return;
    }
    setMonthCursor((prev) => addMonthsToYearMonth(prev.year, prev.month, -1));
  }

  function goNext() {
    markLoading();
    if (viewMode === "week") {
      setWeekStart(addDaysToDateOnly(resolvedWeekStart, 7));
      return;
    }
    setMonthCursor((prev) => addMonthsToYearMonth(prev.year, prev.month, 1));
  }

  function goToday() {
    markLoading();
    if (viewMode === "week") {
      setWeekStart(null);
      return;
    }
    setMonthCursor(getVietnamYearMonth());
  }

  function switchView(next: ScheduleViewMode) {
    if (next === viewMode) return;
    markLoading();
    if (next === "month") {
      // Align month cursor with the week currently on screen.
      const monday = resolvedWeekStart;
      const [y, m] = monday.split("-").map(Number);
      if (y && m) setMonthCursor({ year: y, month: m });
    } else {
      // Jump week to Monday of current month cursor (or today if same month).
      const today = getVietnamYearMonth();
      if (
        monthCursor.year === today.year &&
        monthCursor.month === today.month
      ) {
        setWeekStart(null);
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

  function openSession(session: ScheduleSession) {
    setSelectedSession(session);
    setDetailOpen(true);
  }

  if (!isHydrated || isLoading || !canFetch) {
    return (
      <div className="mx-auto w-full max-w-[96rem] px-3 py-10 sm:px-5 lg:px-6">
        <ScheduleWeekSkeleton mobile={Boolean(isMobile)} />
      </div>
    );
  }

  const rangeLabel =
    viewMode === "week"
      ? formatWeekRangeLabel(resolvedWeekStart, resolvedWeekEnd)
      : formatMonthLabel(monthCursor.year, monthCursor.month);

  const emptyTitle =
    viewMode === "week" ? "Tuần này chưa có lịch" : "Tháng này chưa có lịch";
  const emptyHint =
    viewMode === "week"
      ? "Kiểm tra lớp đã enroll chưa, hoặc chuyển sang tuần khác."
      : "Kiểm tra lớp đã enroll chưa, hoặc chuyển sang tháng khác.";

  return (
    <div className="mx-auto w-full max-w-[96rem] px-3 py-8 sm:px-5 sm:py-10 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Học viên
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Lịch học
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Thời khóa biểu theo tuần hoặc tháng của mọi lớp đang học — không gồm
            bài tự học.
          </p>
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

      {isScheduleLoading ? (
        viewMode === "month" ? (
          <ScheduleMonthSkeleton />
        ) : (
          <ScheduleWeekSkeleton mobile={Boolean(isMobile)} />
        )
      ) : hasError ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <CalendarDays className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-heading text-lg font-semibold">
            Không tải được lịch học
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kiểm tra kết nối rồi thử lại — khoảng thời gian đang xem vẫn được
            giữ.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-xl"
            onClick={() => {
              markLoading();
              if (viewMode === "week") retryWeek();
              else retryMonth();
            }}
          >
            Thử lại
          </Button>
        </div>
      ) : viewMode === "month" ? (
        !monthHasSessions ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <CalendarDays className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-heading text-lg font-semibold text-foreground">
              {emptyTitle}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {emptyHint}
            </p>
            <Link
              href="/courses"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-5 rounded-xl",
              )}
            >
              Xem khóa học của tôi
            </Link>
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
            />
          </div>
        )
      ) : !weekHasSessions ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <CalendarDays className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-3 font-heading text-lg font-semibold text-foreground">
            {emptyTitle}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {emptyHint}
          </p>
          <Link
            href="/courses"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-5 rounded-xl",
            )}
          >
            Xem khóa học của tôi
          </Link>
        </div>
      ) : isMobile ? (
        <ScheduleMobileWeekTabs
          days={days}
          activeDay={activeMobileDay?.date ?? null}
          onDayChange={setMobileDay}
          onOpen={openSession}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid min-h-[28rem] grid-cols-7 lg:min-h-[32rem]">
            {days.map((day, index) => (
              <ScheduleDayColumn
                key={day.date}
                day={day}
                onOpen={openSession}
                isFirst={index === 0}
                isLast={index === days.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      <ScheduleSessionDetailSheet
        audience="student"
        session={selectedSession}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
