"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ClassSession, ClassSessionKind } from "@/lib/api";
import { CLASS_SESSION_KIND_LABELS } from "@/lib/classes/constants";
import { parseApiDateTime } from "@/lib/curriculum/datetime";
import { cn } from "@/lib/utils";

const HOUR_PX = 56;
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 21;
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_MAX_CHIPS = 3;

type CalendarView = "day" | "week" | "month";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Ngày",
  week: "Tuần",
  month: "Tháng",
};

/** Left accent + tint per session kind, matched to the manager palette. */
const KIND_STYLES: Record<ClassSessionKind, string> = {
  Lesson: "border-l-[#7CB342] bg-[#7CB342]/12 text-[#3d5c22]",
  FieldTrip: "border-l-[#7E57C2] bg-[#7E57C2]/12 text-[#51308a]",
  AssignmentWindow: "border-l-[#FDD835] bg-[#FDD835]/18 text-[#8A7200]",
  MentorCheckIn: "border-l-[#E94B3C] bg-[#E94B3C]/10 text-[#a82a1e]",
};

/** Solid dot color per kind for the legend and month chips. */
const KIND_DOT: Record<ClassSessionKind, string> = {
  Lesson: "bg-[#7CB342]",
  FieldTrip: "bg-[#7E57C2]",
  AssignmentWindow: "bg-[#FDD835]",
  MentorCheckIn: "bg-[#E94B3C]",
};

type ParsedSession = { session: ClassSession; start: Date; end: Date };

type PositionedSession = ParsedSession & {
  top: number;
  height: number;
  laneIndex: number;
  laneCount: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Greedy lane packing for one day: overlapping sessions get side-by-side columns. */
function layoutDay(
  sessions: ParsedSession[],
  startHour: number,
): PositionedSession[] {
  const sorted = [...sessions].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  const result: PositionedSession[] = [];
  let cluster: PositionedSession[] = [];
  let clusterEnd = 0;

  const flush = () => {
    const laneCount = cluster.reduce((max, s) => Math.max(max, s.laneIndex + 1), 0);
    for (const item of cluster) item.laneCount = laneCount;
    result.push(...cluster);
    cluster = [];
    clusterEnd = 0;
  };

  for (const item of sorted) {
    const startMin = item.start.getHours() * 60 + item.start.getMinutes();
    const endMin = Math.max(
      startMin + 15,
      item.end.getHours() * 60 + item.end.getMinutes() +
        (isSameDay(item.start, item.end) ? 0 : 24 * 60),
    );
    const offsetMin = startMin - startHour * 60;

    if (cluster.length && startMin >= clusterEnd) flush();

    const laneEnds = new Map<number, number>();
    for (const c of cluster) {
      laneEnds.set(
        c.laneIndex,
        Math.max(laneEnds.get(c.laneIndex) ?? 0, c.end.getHours() * 60 + c.end.getMinutes()),
      );
    }
    let laneIndex = 0;
    while ((laneEnds.get(laneIndex) ?? 0) > startMin) laneIndex += 1;

    cluster.push({
      session: item.session,
      start: item.start,
      end: item.end,
      top: (offsetMin / 60) * HOUR_PX,
      height: Math.max(28, ((endMin - startMin) / 60) * HOUR_PX - 2),
      laneIndex,
      laneCount: 1,
    });
    clusterEnd = Math.max(clusterEnd, endMin);
  }
  if (cluster.length) flush();

  return result;
}

export type SessionCalendarProps = {
  sessions: ClassSession[];
  onSelectSession?: (session: ClassSession) => void;
  /** Fired when an empty slot/day is clicked, with the suggested start time. */
  onCreateAt?: (start: Date) => void;
  /** After a create/update, navigate to and briefly highlight this session. */
  focusSession?: { id: string; nonce: number } | null;
};

export function SessionCalendar({
  sessions,
  onSelectSession,
  onCreateAt,
  focusSession,
}: SessionCalendarProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [showMini, setShowMini] = useState(true);
  const [focused, setFocused] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const lastFocusNonce = useRef<number | null>(null);
  const today = useMemo(() => new Date(), []);

  const parsed = useMemo<ParsedSession[]>(
    () =>
      sessions
        .map((session) => {
          const start = parseApiDateTime(session.startTime);
          if (!start) return null;
          const end = parseApiDateTime(session.endTime) ?? start;
          return { session, start, end };
        })
        .filter((v): v is ParsedSession => v !== null),
    [sessions],
  );

  // Wait for the refreshed data to include the target, then jump + highlight.
  useEffect(() => {
    if (!focusSession) return;
    if (focusSession.nonce === lastFocusNonce.current) return;
    const target = parsed.find((p) => p.session.id === focusSession.id);
    if (!target) return;
    lastFocusNonce.current = focusSession.nonce;
    setView((current) => (current === "month" ? current : "week"));
    setAnchor(startOfDay(target.start));
    setFocused({ id: focusSession.id, nonce: focusSession.nonce });
  }, [focusSession, parsed]);

  useEffect(() => {
    if (!focused) return;
    const timer = setTimeout(() => setFocused(null), 2400);
    return () => clearTimeout(timer);
  }, [focused]);

  function shift(direction: 1 | -1) {
    setAnchor((current) => {
      if (view === "day") return addDays(current, direction);
      if (view === "week") return addDays(current, direction * 7);
      return addMonths(current, direction);
    });
  }

  return (
    <div className="flex flex-col">
      <CalendarToolbar
        view={view}
        anchor={anchor}
        onViewChange={setView}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={() => setAnchor(startOfDay(new Date()))}
        sessions={parsed}
        showMini={showMini}
        onToggleMini={() => setShowMini((value) => !value)}
      />

      <div className="flex flex-col lg:flex-row">
        {showMini ? (
          <MiniMonth
            anchor={anchor}
            today={today}
            sessions={parsed}
            onSelectDay={(day) => setAnchor(startOfDay(day))}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          {view === "month" ? (
            <MonthGrid
              anchor={anchor}
              today={today}
              sessions={parsed}
              focusedId={focused?.id ?? null}
              onSelectSession={onSelectSession}
              onCreateAt={onCreateAt}
            />
          ) : (
            <TimeGrid
              view={view}
              anchor={anchor}
              today={today}
              sessions={parsed}
              focusedId={focused?.id ?? null}
              onSelectSession={onSelectSession}
              onCreateAt={onCreateAt}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MiniMonth({
  anchor,
  today,
  sessions,
  onSelectDay,
}: {
  anchor: Date;
  today: Date;
  sessions: ParsedSession[];
  onSelectDay: (day: Date) => void;
}) {
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(anchor));

  useEffect(() => {
    setDisplayMonth(startOfMonth(anchor));
  }, [anchor]);

  const gridStart = startOfWeek(displayMonth);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  const sessionDays = useMemo(() => {
    const set = new Set<string>();
    for (const { start } of sessions) set.add(dateKey(start));
    return set;
  }, [sessions]);

  return (
    <div className="shrink-0 border-b border-[#E5E5E0] p-4 lg:w-[256px] lg:border-b-0 lg:border-r">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-[#2D2D2D]">
          Tháng {displayMonth.getMonth() + 1}, {displayMonth.getFullYear()}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDisplayMonth((m) => addMonths(m, -1))}
            aria-label="Tháng trước"
            className="flex size-7 items-center justify-center rounded-md text-[#6B6B6B] transition hover:bg-[#F5F5F0]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setDisplayMonth((m) => addMonths(m, 1))}
            aria-label="Tháng sau"
            className="flex size-7 items-center justify-center rounded-md text-[#6B6B6B] transition hover:bg-[#F5F5F0]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="py-1 text-center text-[10px] font-semibold uppercase text-[#9A9A94]"
          >
            {label}
          </span>
        ))}
        {cells.map((day) => {
          const inMonth = day.getMonth() === displayMonth.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, anchor);
          const hasSession = sessionDays.has(dateKey(day));
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative mx-auto flex size-8 items-center justify-center rounded-full text-xs font-medium tabular-nums transition",
                isSelected
                  ? "bg-[#E94B3C] font-bold text-white"
                  : isToday
                    ? "font-bold text-[#E94B3C] ring-1 ring-inset ring-[#E94B3C]/40"
                    : inMonth
                      ? "text-[#2D2D2D] hover:bg-[#F5F5F0]"
                      : "text-[#B5B5AF] hover:bg-[#F5F5F0]",
              )}
            >
              {day.getDate()}
              {hasSession ? (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isSelected ? "bg-white" : "bg-[#E94B3C]",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarToolbar({
  view,
  anchor,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  sessions,
  showMini,
  onToggleMini,
}: {
  view: CalendarView;
  anchor: Date;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  sessions: ParsedSession[];
  showMini: boolean;
  onToggleMini: () => void;
}) {
  const rangeLabel = useMemo(() => {
    if (view === "day") {
      return `${WEEKDAY_LABELS[(anchor.getDay() + 6) % 7]}, ${pad(anchor.getDate())}/${pad(anchor.getMonth() + 1)}/${anchor.getFullYear()}`;
    }
    if (view === "week") {
      const start = startOfWeek(anchor);
      const end = addDays(start, 6);
      return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} – ${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
    }
    return `Tháng ${anchor.getMonth() + 1}, ${anchor.getFullYear()}`;
  }, [view, anchor]);

  const presentKinds = useMemo(() => {
    const from = startOfMonth(anchor).getTime();
    const to = addMonths(startOfMonth(anchor), 1).getTime();
    const set = new Set<ClassSessionKind>();
    for (const { session, start } of sessions) {
      const t = start.getTime();
      if (t >= from && t < to) set.add(session.sessionKind);
    }
    return (Object.keys(KIND_STYLES) as ClassSessionKind[]).filter((k) =>
      set.has(k),
    );
  }, [sessions, anchor]);

  return (
    <div className="flex flex-col gap-3 border-b border-[#E5E5E0] bg-[#FAFAF5]/70 px-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggleMini}
            aria-label={showMini ? "Ẩn mini lịch" : "Hiện mini lịch"}
            aria-pressed={showMini}
            title={showMini ? "Ẩn mini lịch" : "Hiện mini lịch"}
            className={cn(
              "size-9 rounded-lg border-[#D8D8D2]",
              showMini && "bg-[#F5F5F0] text-[#2D2D2D]",
            )}
          >
            {showMini ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onPrev}
            aria-label="Trước"
            className="size-9 rounded-lg border-[#D8D8D2]"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onToday}
            className="h-9 rounded-lg border-[#D8D8D2] px-3 text-sm font-semibold"
          >
            Hôm nay
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNext}
            aria-label="Sau"
            className="size-9 rounded-lg border-[#D8D8D2]"
          >
            <ChevronRight className="size-4" />
          </Button>
          <p className="ml-1 flex items-center gap-2 text-sm font-semibold text-[#2D2D2D]">
            <CalendarDays className="size-4 text-[#E94B3C]" />
            {rangeLabel}
          </p>
        </div>

        <div className="flex items-center self-start rounded-xl border border-[#D8D8D2] bg-white p-1 lg:self-auto">
          {(Object.keys(VIEW_LABELS) as CalendarView[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewChange(key)}
              aria-pressed={view === key}
              className={cn(
                "h-8 rounded-lg px-3 text-sm font-semibold transition",
                view === key
                  ? "bg-[#E94B3C] text-white"
                  : "text-[#6B6B6B] hover:bg-[#F5F5F0]",
              )}
            >
              {VIEW_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {presentKinds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {presentKinds.map((kind) => (
            <span
              key={kind}
              className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B]"
            >
              <span className={cn("size-2.5 rounded-full", KIND_DOT[kind])} />
              {CLASS_SESSION_KIND_LABELS[kind]}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TimeGrid({
  view,
  anchor,
  today,
  sessions,
  focusedId,
  onSelectSession,
  onCreateAt,
}: {
  view: "day" | "week";
  anchor: Date;
  today: Date;
  sessions: ParsedSession[];
  focusedId?: string | null;
  onSelectSession?: (session: ClassSession) => void;
  onCreateAt?: (start: Date) => void;
}) {
  const days = useMemo(() => {
    if (view === "day") return [startOfDay(anchor)];
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [view, anchor]);

  const rangeStart = days[0];
  const rangeEnd = addDays(days[days.length - 1], 1);

  const visible = useMemo(() => {
    const from = rangeStart.getTime();
    const to = rangeEnd.getTime();
    return sessions.filter(
      (v) => v.start.getTime() >= from && v.start.getTime() < to,
    );
  }, [sessions, rangeStart, rangeEnd]);

  const { startHour, endHour } = useMemo(() => {
    let min = DEFAULT_START_HOUR;
    let max = DEFAULT_END_HOUR;
    for (const { start, end } of visible) {
      min = Math.min(min, start.getHours());
      const endH = isSameDay(start, end)
        ? end.getHours() + (end.getMinutes() > 0 ? 1 : 0)
        : 24;
      max = Math.max(max, endH);
    }
    return {
      startHour: Math.max(0, min),
      endHour: Math.min(24, Math.max(max, min + 4)),
    };
  }, [visible]);

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour],
  );
  const gridHeight = (endHour - startHour) * HOUR_PX;

  const positionedByDay = useMemo(
    () =>
      days.map((day) =>
        layoutDay(
          visible.filter((v) => isSameDay(v.start, day)),
          startHour,
        ),
      ),
    [days, visible, startHour],
  );

  const nowOffsetMin =
    today.getHours() * 60 + today.getMinutes() - startHour * 60;
  const isNowVisible =
    nowOffsetMin >= 0 && nowOffsetMin <= (endHour - startHour) * 60;
  const nowTop = (nowOffsetMin / 60) * HOUR_PX;

  const scrollRef = useRef<HTMLDivElement>(null);
  const earliestTop = useMemo(() => {
    let min = Infinity;
    for (const { start } of visible) {
      const offset =
        start.getHours() * 60 + start.getMinutes() - startHour * 60;
      min = Math.min(min, (offset / 60) * HOUR_PX);
    }
    return Number.isFinite(min) ? min : null;
  }, [visible, startHour]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = earliestTop ?? (isNowVisible ? nowTop : null);
    if (target == null) return;
    el.scrollTo({ top: Math.max(0, target - 16), behavior: "smooth" });
  }, [earliestTop, isNowVisible, nowTop, anchor, view]);

  function handleColumnClick(
    event: React.MouseEvent<HTMLDivElement>,
    day: Date,
  ) {
    if (!onCreateAt) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const rawMin = startHour * 60 + (offsetY / HOUR_PX) * 60;
    const snapped = Math.round(rawMin / 30) * 30;
    const start = new Date(day);
    start.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
    onCreateAt(start);
  }

  const gridColsClass =
    view === "day"
      ? "grid-cols-[56px_minmax(0,1fr)]"
      : "grid-cols-[56px_repeat(7,minmax(0,1fr))]";

  return (
    <div ref={scrollRef} className="relative max-h-[600px] overflow-auto">
      <div className={view === "day" ? "min-w-0" : "min-w-[720px]"}>
        {/* Day header row */}
        <div
          className={cn(
            "sticky top-0 z-30 grid border-b border-[#E5E5E0] bg-white",
            gridColsClass,
          )}
        >
          <div className="sticky left-0 z-10 bg-white" />
          {days.map((day) => {
            const weekdayIndex = (day.getDay() + 6) % 7;
            const isToday = isSameDay(day, today);
            const isWeekend = weekdayIndex >= 5;
            const count = visible.filter((v) => isSameDay(v.start, day)).length;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex flex-col items-center gap-0.5 border-l border-[#E5E5E0] py-2",
                  isToday
                    ? "bg-[#E94B3C]/5"
                    : isWeekend
                      ? "bg-[#FAFAF5]/60"
                      : undefined,
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                  {WEEKDAY_LABELS[weekdayIndex]}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                    isToday ? "bg-[#E94B3C] text-white" : "text-[#2D2D2D]",
                  )}
                >
                  {day.getDate()}
                </span>
                <span className="h-3.5 text-[10px] font-medium tabular-nums text-[#9A9A94]">
                  {count > 0 ? `${count} buổi` : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className={cn("grid", gridColsClass)}>
          <div
            className="sticky left-0 z-10 bg-white"
            style={{ height: gridHeight }}
          >
            {hours.map((hour, i) => (
              <div
                key={hour}
                className={cn(
                  "absolute right-2 text-xs font-medium tabular-nums text-[#9A9A94]",
                  i === 0 ? "top-0" : "-translate-y-1/2",
                )}
                style={{ top: i * HOUR_PX }}
              >
                {`${pad(hour)}:00`}
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const weekdayIndex = (day.getDay() + 6) % 7;
            const isToday = isSameDay(day, today);
            const isWeekend = weekdayIndex >= 5;
            return (
              <div
                key={day.toISOString()}
                onClick={(event) => handleColumnClick(event, day)}
                className={cn(
                  "relative border-l border-[#E5E5E0]",
                  onCreateAt && "cursor-copy",
                  isToday
                    ? "bg-[#E94B3C]/[0.03]"
                    : isWeekend
                      ? "bg-[#FAFAF5]/50"
                      : undefined,
                )}
                style={{ height: gridHeight }}
              >
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="pointer-events-none absolute inset-x-0 border-t border-[#EFEFEA]"
                    style={{ top: i * HOUR_PX }}
                  />
                ))}

                {isToday && isNowVisible ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                    style={{ top: nowTop }}
                  >
                    <span className="-ml-1 size-2 shrink-0 rounded-full bg-[#E94B3C]" />
                    <span className="h-px flex-1 bg-[#E94B3C]" />
                  </div>
                ) : null}

                {positionedByDay[dayIndex].map((item) => {
                  const widthPct = 100 / item.laneCount;
                  const isCancelled = item.session.status === "Cancelled";
                  const isFocused = focusedId === item.session.id;
                  return (
                    <button
                      key={item.session.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectSession?.(item.session);
                      }}
                      title={`${item.session.title || "Chưa đặt tiêu đề"} · ${clock(item.start)}–${clock(item.end)}`}
                      className={cn(
                        "group absolute flex flex-col overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left transition hover:z-10 hover:shadow-[0_4px_14px_rgba(45,45,45,0.12)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94B3C]/40",
                        KIND_STYLES[item.session.sessionKind],
                        isCancelled && "opacity-50 line-through",
                        isFocused &&
                          "z-30 animate-pulse ring-2 ring-[#E94B3C] ring-offset-1 shadow-[0_6px_18px_rgba(233,75,60,0.28)]",
                      )}
                      style={{
                        top: Math.max(0, item.top),
                        height: item.height,
                        left: `calc(${item.laneIndex * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      <span className="block truncate text-xs font-semibold leading-snug">
                        {item.session.title || "Chưa đặt tiêu đề"}
                      </span>
                      <span className="block truncate text-[11px] font-medium leading-tight opacity-80">
                        {clock(item.start)}–{clock(item.end)}
                      </span>
                      {item.height > 58 ? (
                        <span className="mt-auto block truncate text-[10px] font-medium opacity-70">
                          {CLASS_SESSION_KIND_LABELS[item.session.sessionKind]}
                          {item.session.location
                            ? ` · ${item.session.location}`
                            : ""}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  anchor,
  today,
  sessions,
  focusedId,
  onSelectSession,
  onCreateAt,
}: {
  anchor: Date;
  today: Date;
  sessions: ParsedSession[];
  focusedId?: string | null;
  onSelectSession?: (session: ClassSession) => void;
  onCreateAt?: (start: Date) => void;
}) {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, ParsedSession[]>();
    for (const item of sessions) {
      const key = `${item.start.getFullYear()}-${item.start.getMonth()}-${item.start.getDate()}`;
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    return map;
  }, [sessions]);

  function handleDayCreate(day: Date) {
    if (!onCreateAt) return;
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    onCreateAt(start);
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 border-b border-[#E5E5E0]">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const items = byDay.get(key) ?? [];
          const isCurrentMonth = day.getMonth() === monthStart.getMonth();
          const isToday = isSameDay(day, today);
          const weekdayIndex = (day.getDay() + 6) % 7;
          const isWeekend = weekdayIndex >= 5;
          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayCreate(day)}
              className={cn(
                "min-h-[104px] border-b border-l border-[#E5E5E0] p-1.5 [&:nth-child(7n)]:border-r-0",
                onCreateAt && "cursor-copy",
                !isCurrentMonth && "bg-[#FAFAF5]/50",
                isWeekend && isCurrentMonth && "bg-[#FAFAF5]/40",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                    isToday
                      ? "bg-[#E94B3C] text-white"
                      : isCurrentMonth
                        ? "text-[#2D2D2D]"
                        : "text-[#B5B5AF]",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {items.slice(0, MONTH_MAX_CHIPS).map((item) => {
                  const isCancelled = item.session.status === "Cancelled";
                  const isFocused = focusedId === item.session.id;
                  return (
                    <button
                      key={item.session.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectSession?.(item.session);
                      }}
                      title={`${item.session.title || "Chưa đặt tiêu đề"} · ${clock(item.start)}`}
                      className={cn(
                        "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-[#F5F5F0]",
                        isCancelled && "opacity-50 line-through",
                        isFocused &&
                          "animate-pulse bg-[#E94B3C]/10 ring-1 ring-[#E94B3C]",
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          KIND_DOT[item.session.sessionKind],
                        )}
                      />
                      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#6B6B6B]">
                        {clock(item.start)}
                      </span>
                      <span className="truncate text-[11px] font-medium text-[#2D2D2D]">
                        {item.session.title || "Chưa đặt tiêu đề"}
                      </span>
                    </button>
                  );
                })}
                {items.length > MONTH_MAX_CHIPS ? (
                  <span className="block px-1.5 text-[10px] font-semibold text-[#9A9A94]">
                    +{items.length - MONTH_MAX_CHIPS} buổi khác
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
