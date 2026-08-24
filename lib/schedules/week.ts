/** Calendar helpers for student weekly schedule (Asia/Ho_Chi_Minh). */

export const SCHEDULE_TIMEZONE = "Asia/Ho_Chi_Minh";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value: string): boolean {
  return DATE_ONLY_RE.test(value);
}

/** Parts of a Date in a given IANA timezone as calendar yyyy-MM-dd + weekday. */
export function getZonedDateParts(
  date: Date,
  timeZone: string = SCHEDULE_TIMEZONE,
): { year: number; month: number; day: number; weekday: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(lookup("year")),
    month: Number(lookup("month")),
    day: Number(lookup("day")),
    weekday: lookup("weekday"),
  };
}

export function toDateOnlyString(
  year: number,
  month: number,
  day: number,
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Parse `yyyy-MM-dd` as a UTC noon anchor (stable for ±day math). */
export function parseDateOnlyUtc(dateOnly: string): Date | null {
  if (!isDateOnly(dateOnly)) return null;
  const [y, m, d] = dateOnly.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function addDaysToDateOnly(dateOnly: string, days: number): string {
  const base = parseDateOnlyUtc(dateOnly);
  if (!base) return dateOnly;
  base.setUTCDate(base.getUTCDate() + days);
  return toDateOnlyString(
    base.getUTCFullYear(),
    base.getUTCMonth() + 1,
    base.getUTCDate(),
  );
}

/**
 * Monday (`yyyy-MM-dd`) of the VN week containing `date`.
 * Uses ISO-style week (Mon–Sun).
 */
export function getVietnamMondayOf(date: Date = new Date()): string {
  const { year, month, day, weekday } = getZonedDateParts(date);
  const dateOnly = toDateOnlyString(year, month, day);
  const weekdayToOffsetFromMonday: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offset = weekdayToOffsetFromMonday[weekday] ?? 0;
  return addDaysToDateOnly(dateOnly, -offset);
}

/** True when `yyyy-MM-dd` is a Monday in the civil calendar (not TZ-dependent). */
export function isMondayDateOnly(dateOnly: string): boolean {
  const base = parseDateOnlyUtc(dateOnly);
  if (!base) return false;
  // UTC noon of a date-only Monday is still Monday in UTC weekday.
  return base.getUTCDay() === 1;
}

export function formatVietnamTimeRange(
  startIso: string,
  endIso: string,
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  const timeFmt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: SCHEDULE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}

export function formatWeekRangeLabel(
  weekStart: string,
  weekEnd: string,
): string {
  const start = parseDateOnlyUtc(weekStart);
  const end = parseDateOnlyUtc(weekEnd);
  if (!start || !end) return weekStart;

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${start.getUTCDate()}–${end.getUTCDate()} Thg ${start.getUTCMonth() + 1} ${start.getUTCFullYear()}`;
  }

  return `${start.getUTCDate()} Thg ${start.getUTCMonth() + 1} – ${end.getUTCDate()} Thg ${end.getUTCMonth() + 1} ${end.getUTCFullYear()}`;
}

export function formatDayColumnLabel(dateOnly: string): {
  weekday: string;
  dayMonth: string;
} {
  const base = parseDateOnlyUtc(dateOnly);
  if (!base) return { weekday: "", dayMonth: dateOnly };

  const weekdayFmt = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    timeZone: "UTC",
  });
  const dayFmt = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  });

  return {
    weekday: weekdayFmt.format(base).replace(/\.$/, ""),
    dayMonth: dayFmt.format(base),
  };
}

export function isTodayDateOnly(dateOnly: string): boolean {
  const today = getZonedDateParts(new Date());
  return dateOnly === toDateOnlyString(today.year, today.month, today.day);
}

/** Monday on or before a civil `yyyy-MM-dd` (UTC date math). */
export function mondayOnOrBefore(dateOnly: string): string {
  const base = parseDateOnlyUtc(dateOnly);
  if (!base) return dateOnly;
  const utcDay = base.getUTCDay(); // 0 Sun … 1 Mon
  const offset = utcDay === 0 ? 6 : utcDay - 1;
  return addDaysToDateOnly(dateOnly, -offset);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addMonthsToYearMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const anchor = new Date(Date.UTC(year, month - 1 + delta, 1));
  return {
    year: anchor.getUTCFullYear(),
    month: anchor.getUTCMonth() + 1,
  };
}

/** Mondays covering every day of the civil month (for weekly API fan-out). */
export function getMonthGridMondays(year: number, month: number): string[] {
  const first = toDateOnlyString(year, month, 1);
  const last = toDateOnlyString(year, month, daysInMonth(year, month));
  let cursor = mondayOnOrBefore(first);
  const endMonday = mondayOnOrBefore(last);
  const mondays: string[] = [];
  while (cursor <= endMonday) {
    mondays.push(cursor);
    cursor = addDaysToDateOnly(cursor, 7);
  }
  return mondays;
}

/** 42 date-only cells (6 weeks × Mon–Sun) starting at the Monday of week 1. */
export function getMonthGridCells(year: number, month: number): string[] {
  const first = toDateOnlyString(year, month, 1);
  const gridStart = mondayOnOrBefore(first);
  return Array.from({ length: 42 }, (_, index) =>
    addDaysToDateOnly(gridStart, index),
  );
}

export function formatMonthLabel(year: number, month: number): string {
  return `Thg ${month} ${year}`;
}

export function isSameMonthDateOnly(
  dateOnly: string,
  year: number,
  month: number,
): boolean {
  if (!isDateOnly(dateOnly)) return false;
  const [y, m] = dateOnly.split("-").map(Number);
  return y === year && m === month;
}

export function getVietnamYearMonth(date: Date = new Date()): {
  year: number;
  month: number;
} {
  const parts = getZonedDateParts(date);
  return { year: parts.year, month: parts.month };
}
