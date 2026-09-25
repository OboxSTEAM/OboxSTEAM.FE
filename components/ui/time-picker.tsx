"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse `HH:mm` or `HH:mm:ss` into minutes from midnight. */
export function parseTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function formatTimeLabel(minutes: number): string {
  const safe = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
}

function splitMinutes(total: number | null): { h: number; m: number } | null {
  if (total == null) return null;
  return { h: Math.floor(total / 60), m: total % 60 };
}

export type TimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  /** Soft floor as `HH:mm`. */
  min?: string;
  /** When true, the exact `min` slot is also locked. */
  minExclusive?: boolean;
  /** Soft ceiling as `HH:mm`. */
  max?: string;
  /** Highlight another time in the list (e.g. start while picking end). */
  referenceTime?: string;
  referenceLabel?: string;
  /** Minute column step. Default `1` (native-like). */
  minuteStep?: number;
  allowClear?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

/**
 * Shared time picker — separate hour + minute columns (native pattern),
 * styled to match DateTimePicker chrome. Value format: `HH:mm`.
 */
export function TimePicker({
  id,
  value,
  onChange,
  ariaLabel,
  placeholder = "Chọn giờ",
  min,
  minExclusive = false,
  max,
  referenceTime,
  referenceLabel = "Mốc",
  minuteStep = 1,
  allowClear = false,
  disabled,
  invalid,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedMins = parseTimeToMinutes(value);
  const minMins = parseTimeToMinutes(min ?? "");
  const maxMins = parseTimeToMinutes(max ?? "");
  const referenceMins = parseTimeToMinutes(referenceTime ?? "");
  const selectedParts = splitMinutes(selectedMins);
  const referenceParts = splitMinutes(referenceMins);

  const [draftHour, setDraftHour] = useState<number | null>(
    () => selectedParts?.h ?? null,
  );
  const [draftMinute, setDraftMinute] = useState<number | null>(
    () => selectedParts?.m ?? null,
  );

  useEffect(() => {
    if (!open) return;
    setDraftHour(selectedParts?.h ?? referenceParts?.h ?? 9);
    setDraftMinute(selectedParts?.m ?? null);
  }, [open, selectedParts?.h, selectedParts?.m, referenceParts?.h]);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, h) => h),
    [],
  );
  const minutes = useMemo(() => {
    const step = Math.max(1, Math.min(30, minuteStep));
    const list: number[] = [];
    for (let m = 0; m < 60; m += step) list.push(m);
    return list;
  }, [minuteStep]);

  const hourRef = useRef<HTMLButtonElement>(null);
  const minuteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    hourRef.current?.scrollIntoView({ block: "center" });
    minuteRef.current?.scrollIntoView({ block: "center" });
  }, [open, draftHour, draftMinute]);

  function isMinsLocked(mins: number): boolean {
    if (minMins != null) {
      if (minExclusive ? mins <= minMins : mins < minMins) return true;
    }
    if (maxMins != null && mins > maxMins) return true;
    return false;
  }

  function isHourLocked(h: number): boolean {
    return minutes.every((m) => isMinsLocked(h * 60 + m));
  }

  function isMinuteLocked(h: number | null, m: number): boolean {
    if (h == null) return false;
    return isMinsLocked(h * 60 + m);
  }

  function commit(h: number, m: number) {
    const mins = h * 60 + m;
    if (isMinsLocked(mins)) return;
    onChange(formatTimeLabel(mins));
    setOpen(false);
  }

  function handlePickHour(h: number) {
    if (isHourLocked(h)) return;
    setDraftHour(h);
    const nextMinute =
      draftMinute != null && !isMinuteLocked(h, draftMinute)
        ? draftMinute
        : minutes.find((m) => !isMinuteLocked(h, m)) ?? null;
    setDraftMinute(nextMinute);
    if (nextMinute != null && selectedParts != null) {
      // Hour change with an existing value — update live; keep open for minute tweak.
      onChange(formatTimeLabel(h * 60 + nextMinute));
    }
  }

  function handlePickMinute(m: number) {
    const h = draftHour ?? selectedParts?.h ?? 9;
    if (isMinuteLocked(h, m)) return;
    setDraftHour(h);
    setDraftMinute(m);
    commit(h, m);
  }

  function handleClear() {
    onChange("");
    setDraftHour(null);
    setDraftMinute(null);
    setOpen(false);
  }

  const triggerLabel =
    selectedMins != null ? formatTimeLabel(selectedMins) : placeholder;
  const showFooter = Boolean(
    (referenceMins != null && referenceTime) ||
      (minMins != null && min) ||
      (allowClear && value),
  );

  const activeHour = draftHour;
  const activeMinute = draftMinute;

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
        <Clock className="size-4 shrink-0 opacity-60" />
        <span
          className={cn(
            "truncate tabular-nums",
            selectedMins != null ? "font-medium" : "opacity-55",
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
          <TimeColumn
            label="Giờ"
            values={hours}
            active={activeHour}
            reference={
              referenceParts && referenceParts.h !== activeHour
                ? referenceParts.h
                : null
            }
            isLocked={isHourLocked}
            activeRef={hourRef}
            onPick={handlePickHour}
            format={(n) => pad(n)}
          />
          <div className="w-px self-stretch bg-border" aria-hidden />
          <TimeColumn
            label="Phút"
            values={minutes}
            active={activeMinute}
            reference={
              referenceParts &&
              activeHour === referenceParts.h &&
              referenceParts.m !== activeMinute
                ? referenceParts.m
                : null
            }
            isLocked={(m) => isMinuteLocked(activeHour, m)}
            activeRef={minuteRef}
            onPick={handlePickMinute}
            format={(n) => pad(n)}
            muted={activeHour == null}
          />
        </div>

        {showFooter ? (
          <div className="space-y-1 border-t border-border px-3 py-2">
            {referenceMins != null && referenceTime ? (
              <p className="text-[11px] text-muted-foreground">
                {referenceLabel}:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatTimeLabel(referenceMins)}
                </span>
              </p>
            ) : null}
            {minMins != null && min ? (
              <p className="text-[11px] text-muted-foreground">
                Từ{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatTimeLabel(minMins)}
                </span>
              </p>
            ) : null}
            {allowClear && value ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                Xóa giờ đã chọn
              </button>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  values,
  active,
  reference,
  isLocked,
  activeRef,
  onPick,
  format,
  muted = false,
}: {
  label: string;
  values: number[];
  active: number | null;
  reference: number | null;
  isLocked: (value: number) => boolean;
  activeRef: React.RefObject<HTMLButtonElement | null>;
  onPick: (value: number) => void;
  format: (value: number) => string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-[88px] flex-col bg-muted/15 py-2",
        muted && "opacity-70",
      )}
    >
      <p className="mb-1.5 px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="max-h-[240px] space-y-0.5 overflow-y-auto overscroll-contain px-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                "w-full rounded-lg px-2 py-1.5 text-center text-sm font-medium tabular-nums transition-[background-color,color,opacity,box-shadow] duration-150",
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
              {format(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
