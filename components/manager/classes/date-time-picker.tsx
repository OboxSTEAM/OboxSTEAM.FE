"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

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

/** Parse the "YYYY-MM-DDTHH:mm" local-input string used by the form. */
function parseLocalInput(value: string): Date | null {
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

function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type DateTimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  /** Time-slot granularity in minutes. */
  minuteStep?: number;
  /** Default hour applied when a day is picked before any time. */
  defaultHour?: number;
  disabled?: boolean;
  invalid?: boolean;
};

export function DateTimePicker({
  id,
  value,
  onChange,
  ariaLabel,
  placeholder = "Chọn ngày & giờ",
  minuteStep = 15,
  defaultHour = 9,
  disabled,
  invalid,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseLocalInput(value);
  const today = startOfDay(new Date());

  const [displayMonth, setDisplayMonth] = useState(() =>
    startOfMonth(selected ?? today),
  );

  useEffect(() => {
    if (open) setDisplayMonth(startOfMonth(selected ?? today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const gridStart = startOfWeek(displayMonth);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );

  const slots = useMemo(() => {
    const list: Array<{ h: number; m: number; label: string }> = [];
    for (let mins = 0; mins < 24 * 60; mins += minuteStep) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      list.push({ h, m, label: `${pad(h)}:${pad(m)}` });
    }
    return list;
  }, [minuteStep]);

  const selectedSlotRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && selectedSlotRef.current) {
      selectedSlotRef.current.scrollIntoView({ block: "center" });
    }
  }, [open]);

  function handlePickDate(day: Date) {
    const next = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      selected ? selected.getHours() : defaultHour,
      selected ? selected.getMinutes() : 0,
    );
    onChange(toLocalInput(next));
  }

  function handlePickTime(h: number, m: number) {
    const base = selected ?? today;
    const next = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h,
      m,
    );
    onChange(toLocalInput(next));
    setOpen(false);
  }

  const triggerLabel = selected
    ? `${pad(selected.getDate())}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()} · ${pad(selected.getHours())}:${pad(selected.getMinutes())}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 text-left text-sm outline-none transition-colors",
          "focus-visible:border-[#4FC3F7] focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/40",
          invalid ? "border-[#E94B3C]" : "border-[#DDDDD8] hover:border-[#C4C4BE]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <CalendarClock className="size-4 shrink-0 text-[#9A9A94]" />
        <span
          className={cn(
            "truncate",
            selected ? "text-[#2D2D2D]" : "text-[#9A9A94]",
          )}
        >
          {triggerLabel}
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="flex w-auto gap-3 p-3"
      >
        <div className="w-[240px]">
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
              const isSelected = selected ? isSameDay(day, selected) : false;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handlePickDate(day)}
                  className={cn(
                    "mx-auto flex size-8 items-center justify-center rounded-full text-xs font-medium tabular-nums transition",
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
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-[92px] flex-col border-l border-[#EDEDE8] pl-2">
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase text-[#9A9A94]">
            Giờ
          </p>
          <div className="max-h-[248px] space-y-0.5 overflow-y-auto pr-1">
            {slots.map((slot) => {
              const isSelected =
                selected != null &&
                selected.getHours() === slot.h &&
                selected.getMinutes() === slot.m;
              return (
                <button
                  key={slot.label}
                  ref={isSelected ? selectedSlotRef : undefined}
                  type="button"
                  onClick={() => handlePickTime(slot.h, slot.m)}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-center text-xs font-medium tabular-nums transition",
                    isSelected
                      ? "bg-[#E94B3C] text-white"
                      : "text-[#2D2D2D] hover:bg-[#F5F5F0]",
                  )}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
