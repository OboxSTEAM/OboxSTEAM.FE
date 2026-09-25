"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const offset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Parse `YYYY-MM-DDTHH:mm` local datetime used by forms. */
export function parseLocalInput(value: string): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parse `YYYY-MM-DD` date-only value. */
export function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Accept datetime or date-only bound strings. */
export function parseBoundDate(value: string): Date | null {
  return parseLocalInput(value) ?? parseDateOnly(value);
}

export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Compact display, e.g. `25/09/2026 · 09:00`. */
export function formatLocalInputDisplay(value: string): string {
  const date = parseLocalInput(value);
  if (!date) return "";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Compact date-only display, e.g. `25/09/2026`. */
export function formatDateOnlyDisplay(value: string): string {
  const date = parseBoundDate(value);
  if (!date) return "";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export type DateTimePickerMode = "datetime" | "date";

export type DateTimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  /**
   * - `datetime` — `YYYY-MM-DDTHH:mm` + time list (default)
   * - `date` — `YYYY-MM-DD` calendar only
   */
  mode?: DateTimePickerMode;
  /** Soft floor — days/times before this are locked. */
  min?: string;
  /** When true, the exact `min` instant is also locked (end must be after start). */
  minExclusive?: boolean;
  /** Soft ceiling — days/times after this are locked. */
  max?: string;
  /**
   * Secondary date to highlight on the calendar (e.g. class start while
   * picking end).
   */
  referenceDate?: string;
  /** Legend label for `referenceDate`. Defaults to "Mốc". */
  referenceLabel?: string;
  /** Time-slot granularity in minutes (datetime mode). */
  minuteStep?: number;
  /** Default hour applied when a day is picked before any time. */
  defaultHour?: number;
  /** Show a clear action when a value is set. */
  allowClear?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

/**
 * Shared date / datetime picker — calendar (+ optional time list), soft
 * min/max locks, optional reference-day marker for paired start/end fields.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  ariaLabel,
  placeholder,
  mode = "datetime",
  min,
  minExclusive = false,
  max,
  referenceDate,
  referenceLabel = "Mốc",
  minuteStep = 15,
  defaultHour = 9,
  allowClear = false,
  disabled,
  invalid,
  className,
}: DateTimePickerProps) {
  const isDateOnly = mode === "date";
  const resolvedPlaceholder =
    placeholder ?? (isDateOnly ? "Chọn ngày" : "Chọn ngày & giờ");

  const [open, setOpen] = useState(false);
  const selected = isDateOnly
    ? parseBoundDate(value)
    : parseLocalInput(value);
  const minDate = parseBoundDate(min ?? "");
  const maxDate = parseBoundDate(max ?? "");
  const reference = parseBoundDate(referenceDate ?? "");
  const today = startOfDay(new Date());

  const fallbackMonth = startOfMonth(
    selected ?? reference ?? minDate ?? today,
  );

  const [displayMonth, setDisplayMonth] = useState(fallbackMonth);

  useEffect(() => {
    if (open) {
      setDisplayMonth(
        startOfMonth(selected ?? reference ?? minDate ?? today),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const gridStart = startOfWeek(displayMonth);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  const minuteOptions = useMemo(() => {
    if (isDateOnly) return [] as number[];
    const step = Math.max(1, Math.min(30, minuteStep));
    const list: number[] = [];
    for (let m = 0; m < 60; m += step) list.push(m);
    return list;
  }, [isDateOnly, minuteStep]);

  const hourOptions = useMemo(
    () => (isDateOnly ? [] : Array.from({ length: 24 }, (_, h) => h)),
    [isDateOnly],
  );

  const [draftHour, setDraftHour] = useState<number | null>(null);
  const [draftMinute, setDraftMinute] = useState<number | null>(null);

  useEffect(() => {
    if (!open || isDateOnly) return;
    setDraftHour(selected?.getHours() ?? reference?.getHours() ?? defaultHour);
    setDraftMinute(selected?.getMinutes() ?? null);
  }, [open, isDateOnly, selected, reference, defaultHour]);

  const hourSlotRef = useRef<HTMLButtonElement>(null);
  const minuteSlotRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open || isDateOnly) return;
    hourSlotRef.current?.scrollIntoView({ block: "center" });
    minuteSlotRef.current?.scrollIntoView({ block: "center" });
  }, [open, isDateOnly, draftHour, draftMinute]);

  function isDayLocked(day: Date): boolean {
    const dayStart = startOfDay(day);
    if (minDate && dayStart.getTime() < startOfDay(minDate).getTime()) {
      return true;
    }
    if (maxDate && dayStart.getTime() > startOfDay(maxDate).getTime()) {
      return true;
    }
    if (isDateOnly && minExclusive && minDate && isSameDay(day, minDate)) {
      return true;
    }
    return false;
  }

  function isTimeLocked(day: Date, h: number, m: number): boolean {
    if (isDateOnly) return false;
    const candidate = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      h,
      m,
    );
    if (minDate) {
      const tooEarly = minExclusive
        ? candidate.getTime() <= minDate.getTime()
        : candidate.getTime() < minDate.getTime();
      if (tooEarly) return true;
    }
    if (maxDate && candidate.getTime() > maxDate.getTime()) return true;
    return false;
  }

  function timeBaseDay(): Date {
    return selected ?? reference ?? minDate ?? today;
  }

  function isHourLocked(h: number): boolean {
    const base = timeBaseDay();
    return minuteOptions.every((m) => isTimeLocked(base, h, m));
  }

  function isMinuteOptionLocked(h: number | null, m: number): boolean {
    if (h == null) return false;
    return isTimeLocked(timeBaseDay(), h, m);
  }

  function clampToBounds(date: Date): Date {
    let next = date;
    if (minDate) {
      if (isDateOnly) {
        const day = startOfDay(next);
        const minDay = startOfDay(minDate);
        if (minExclusive ? day.getTime() <= minDay.getTime() : day.getTime() < minDay.getTime()) {
          next = minExclusive ? addDays(minDay, 1) : minDay;
        }
      } else {
        const tooEarly = minExclusive
          ? next.getTime() <= minDate.getTime()
          : next.getTime() < minDate.getTime();
        if (tooEarly) {
          next = new Date(
            minDate.getTime() + (minExclusive ? minuteStep * 60_000 : 0),
          );
        }
      }
    }
    if (maxDate) {
      if (isDateOnly) {
        const day = startOfDay(next);
        const maxDay = startOfDay(maxDate);
        if (day.getTime() > maxDay.getTime()) next = maxDay;
      } else if (next.getTime() > maxDate.getTime()) {
        next = new Date(maxDate);
      }
    }
    return next;
  }

  function handlePickDate(day: Date) {
    if (isDayLocked(day)) return;

    if (isDateOnly) {
      const next = clampToBounds(startOfDay(day));
      onChange(toDateOnly(next));
      setOpen(false);
      return;
    }

    const next = clampToBounds(
      new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        selected ? selected.getHours() : defaultHour,
        selected ? selected.getMinutes() : 0,
      ),
    );
    onChange(toLocalInput(next));
  }

  function commitTime(h: number, m: number) {
    const base = timeBaseDay();
    if (isTimeLocked(base, h, m)) return;
    const next = clampToBounds(
      new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m),
    );
    onChange(toLocalInput(next));
    setOpen(false);
  }

  function handlePickHour(h: number) {
    if (isHourLocked(h)) return;
    setDraftHour(h);
    const nextMinute =
      draftMinute != null && !isMinuteOptionLocked(h, draftMinute)
        ? draftMinute
        : minuteOptions.find((m) => !isMinuteOptionLocked(h, m)) ?? null;
    setDraftMinute(nextMinute);
    if (nextMinute != null && selected) {
      const base = timeBaseDay();
      const next = clampToBounds(
        new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, nextMinute),
      );
      onChange(toLocalInput(next));
    }
  }

  function handlePickMinute(m: number) {
    const h = draftHour ?? selected?.getHours() ?? defaultHour;
    if (isMinuteOptionLocked(h, m)) return;
    setDraftHour(h);
    setDraftMinute(m);
    commitTime(h, m);
  }

  function jumpToUsefulMonth() {
    const target = selected ?? reference ?? minDate ?? today;
    setDisplayMonth(startOfMonth(target));
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  const triggerLabel = selected
    ? isDateOnly
      ? formatDateOnlyDisplay(value)
      : formatLocalInputDisplay(value)
    : resolvedPlaceholder;

  const canGoPrevMonth = (() => {
    if (!minDate) return true;
    const prevMonthEnd = addDays(displayMonth, -1);
    return !isDayLocked(startOfDay(prevMonthEnd));
  })();

  const canGoNextMonth = (() => {
    if (!maxDate) return true;
    const nextMonthStart = addMonths(displayMonth, 1);
    return !isDayLocked(startOfDay(nextMonthStart));
  })();

  const showLegend = Boolean(minDate || reference);
  const TriggerIcon = isDateOnly ? Calendar : CalendarClock;
  const activeHour = draftHour;
  const activeMinute = draftMinute;
  const referenceHour = reference?.getHours() ?? null;
  const referenceMinute = reference?.getMinutes() ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border bg-card px-3 text-left text-sm outline-none transition-[border-color,box-shadow,background-color] duration-150",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
          invalid
            ? "border-primary"
            : "border-input hover:border-muted-foreground/40",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <TriggerIcon className="size-4 shrink-0 opacity-60" />
        <span
          className={cn(
            "truncate tabular-nums",
            selected ? "font-medium" : "opacity-55",
          )}
        >
          {triggerLabel}
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto gap-0 overflow-hidden rounded-2xl p-0 shadow-lg ring-1 ring-foreground/8"
      >
        <div className="flex">
          <div className={cn("p-3", isDateOnly ? "w-[280px]" : "w-[252px]")}>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-sm font-bold tracking-tight text-foreground">
                Tháng {displayMonth.getMonth() + 1},{" "}
                {displayMonth.getFullYear()}
              </p>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setDisplayMonth((m) => addMonths(m, -1))}
                  aria-label="Tháng trước"
                  disabled={!canGoPrevMonth}
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={jumpToUsefulMonth}
                  className="rounded-md px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  Đi tới
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMonth((m) => addMonths(m, 1))}
                  aria-label="Tháng sau"
                  disabled={!canGoNextMonth}
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {WEEKDAY_LABELS.map((label) => (
                <span
                  key={label}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {label}
                </span>
              ))}
              {cells.map((day) => {
                const inMonth = day.getMonth() === displayMonth.getMonth();
                const isToday = isSameDay(day, today);
                const isSelected = selected ? isSameDay(day, selected) : false;
                const isReference =
                  reference && !isSelected ? isSameDay(day, reference) : false;
                const locked = isDayLocked(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={locked}
                    onClick={() => handlePickDate(day)}
                    aria-label={`${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()}${isReference ? ` · ${referenceLabel}` : ""}`}
                    className={cn(
                      "relative mx-auto flex size-8 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-[background-color,color,box-shadow,opacity] duration-150",
                      locked &&
                        "cursor-not-allowed text-muted-foreground/35 line-through decoration-muted-foreground/30",
                      !locked &&
                        isSelected &&
                        "bg-primary font-bold text-white shadow-sm shadow-primary/25",
                      !locked &&
                        !isSelected &&
                        isReference &&
                        "font-bold text-[#0d6e9c] ring-2 ring-inset ring-[#4FC3F7]",
                      !locked &&
                        !isSelected &&
                        !isReference &&
                        isToday &&
                        "font-bold text-primary ring-1 ring-inset ring-primary/40",
                      !locked &&
                        !isSelected &&
                        !isReference &&
                        !isToday &&
                        inMonth &&
                        "text-foreground hover:bg-muted",
                      !locked &&
                        !isSelected &&
                        !isReference &&
                        !isToday &&
                        !inMonth &&
                        "text-muted-foreground/60 hover:bg-muted",
                    )}
                  >
                    {day.getDate()}
                    {isReference ? (
                      <span className="absolute -bottom-0.5 size-1 rounded-full bg-[#4FC3F7]" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {showLegend || (allowClear && value) ? (
              <div className="mt-3 space-y-1.5 border-t border-border pt-2.5">
                {reference ? (
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex size-3.5 items-center justify-center rounded-full ring-2 ring-inset ring-[#4FC3F7]" />
                    <span>
                      {referenceLabel}:{" "}
                      <span className="font-medium tabular-nums text-foreground">
                        {isDateOnly
                          ? formatDateOnlyDisplay(referenceDate ?? "")
                          : formatLocalInputDisplay(referenceDate ?? "") ||
                            formatDateOnlyDisplay(referenceDate ?? "")}
                      </span>
                    </span>
                  </p>
                ) : null}
                {minDate ? (
                  <p className="text-[11px] text-muted-foreground">
                    Từ{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {isDateOnly
                        ? formatDateOnlyDisplay(min ?? "")
                        : formatLocalInputDisplay(min ?? "") ||
                          formatDateOnlyDisplay(min ?? "")}
                    </span>
                  </p>
                ) : null}
                {allowClear && value ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                  >
                    Xóa ngày đã chọn
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {!isDateOnly ? (
            <div className="flex border-l border-border">
              <DateTimeColumn
                label="Giờ"
                values={hourOptions}
                active={activeHour}
                reference={
                  referenceHour != null && referenceHour !== activeHour
                    ? referenceHour
                    : null
                }
                isLocked={isHourLocked}
                activeRef={hourSlotRef}
                onPick={handlePickHour}
              />
              <div className="w-px self-stretch bg-border" aria-hidden />
              <DateTimeColumn
                label="Phút"
                values={minuteOptions}
                active={activeMinute}
                reference={
                  referenceMinute != null &&
                  activeHour === referenceHour &&
                  referenceMinute !== activeMinute
                    ? referenceMinute
                    : null
                }
                isLocked={(m) => isMinuteOptionLocked(activeHour, m)}
                activeRef={minuteSlotRef}
                onPick={handlePickMinute}
                muted={activeHour == null}
              />
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DateTimeColumn({
  label,
  values,
  active,
  reference,
  isLocked,
  activeRef,
  onPick,
  muted = false,
}: {
  label: string;
  values: number[];
  active: number | null;
  reference: number | null;
  isLocked: (value: number) => boolean;
  activeRef: React.RefObject<HTMLButtonElement | null>;
  onPick: (value: number) => void;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-[72px] flex-col bg-muted/20 py-3",
        muted && "opacity-70",
      )}
    >
      <p className="mb-1.5 px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="max-h-[260px] space-y-0.5 overflow-y-auto overscroll-contain px-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {values.map((value) => {
          const locked = isLocked(value);
          const isSelected = active === value;
          const isReference = reference === value && !isSelected;
          return (
            <button
              key={value}
              ref={isSelected ? activeRef : undefined}
              type="button"
              disabled={locked}
              onClick={() => onPick(value)}
              className={cn(
                "w-full rounded-lg px-1.5 py-1.5 text-center text-xs font-medium tabular-nums transition-[background-color,color,opacity,box-shadow] duration-150",
                locked &&
                  "cursor-not-allowed text-muted-foreground/30 line-through",
                !locked &&
                  isSelected &&
                  "bg-primary font-semibold text-white shadow-sm shadow-primary/20",
                !locked &&
                  !isSelected &&
                  isReference &&
                  "font-semibold text-[#0d6e9c] ring-1 ring-inset ring-[#4FC3F7]",
                !locked &&
                  !isSelected &&
                  !isReference &&
                  "text-foreground hover:bg-muted",
              )}
            >
              {pad(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
