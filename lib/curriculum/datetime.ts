/**
 * Curriculum activity datetime helpers.
 * Backend may return ISO (`2026-07-16T09:00:00Z`) or legacy (`15/06/2026 14:30:00`).
 */

const LEGACY_API =
  /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse API datetime into a Date (local semantics for legacy strings). */
export function parseApiDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;

  const legacy = value.trim().match(LEGACY_API);
  if (legacy) {
    const [, dd, mm, yyyy, hh, min, ss] = legacy;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss ?? "0"),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** API → `datetime-local` input value (`yyyy-MM-ddTHH:mm`). */
export function fromApiDateTimeToLocalInput(
  value: string | null | undefined,
): string {
  const d = parseApiDateTime(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` → legacy API string still accepted by create/update. */
export function toApiDateTimeFromLocalInput(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

const displayFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Single timestamp for UI, e.g. `16/07/2026, 16:00`. */
export function formatApiDateTimeDisplay(
  value: string | null | undefined,
): string {
  const d = parseApiDateTime(value);
  if (!d) return "";
  return displayFormatter.format(d);
}

/**
 * Compact range for tree/list chips, e.g. `16/07 09:00–11:00`
 * or `16/07 09:00 → 17/07 11:00` when spanning days.
 */
export function formatActivityScheduleRange(
  startTime: string | null | undefined,
  endTime?: string | null | undefined,
): string {
  const start = parseApiDateTime(startTime);
  if (!start) return "";

  const startDate = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}`;
  const startClock = `${pad(start.getHours())}:${pad(start.getMinutes())}`;

  const end = parseApiDateTime(endTime ?? null);
  if (!end) return `${startDate} ${startClock}`;

  const endDate = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}`;
  const endClock = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  if (startDate === endDate) {
    return `${startDate} ${startClock}–${endClock}`;
  }
  return `${startDate} ${startClock} → ${endDate} ${endClock}`;
}
