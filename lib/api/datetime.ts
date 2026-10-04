/**
 * Shared API datetime helpers.
 * Backend may return ISO (`2026-07-16T09:00:00Z`) or legacy (`15/06/2026 14:30:00`).
 */

import { SCHEDULE_TIMEZONE } from "@/lib/schedules/week";

const LEGACY_API =
  /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;

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

const ISO_HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/** Parse an API datetime the backend documents as UTC (zone-less values read as UTC). */
export function parseUtcApiDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();

  const legacy = trimmed.match(LEGACY_API);
  if (legacy) {
    const [, dd, mm, yyyy, hh, min, ss] = legacy;
    const d = new Date(
      Date.UTC(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min),
        Number(ss ?? "0"),
      ),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(ISO_HAS_ZONE.test(trimmed) ? trimmed : `${trimmed}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const WALL_CLOCK = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function padTime(n: number): string {
  return String(n).padStart(2, "0");
}

/** Minutes east of UTC for `timeZone` at `instant` (ICT is +420, no DST). */
function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const pick = (type: Intl.DateTimeFormatPartTypes) => {
    const raw = Number(parts.find((part) => part.type === type)?.value ?? "NaN");
    return type === "hour" && raw === 24 ? 0 : raw;
  };

  const asUtc = Date.UTC(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    pick("hour"),
    pick("minute"),
    pick("second"),
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/**
 * Wall-clock `HH:mm` in Vietnam → UTC `HH:mm:ss` for generate-sessions.
 * The API stores that clock as UTC; the calendar then renders local time.
 * `09:00` must be sent as `02:00:00`, otherwise the schedule shows 16:00.
 */
export function wallClockToUtcTimeString(
  value: string,
  timeZone: string = SCHEDULE_TIMEZONE,
): string | null {
  const match = value.trim().match(WALL_CLOCK);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? "0");
  if (hours > 23 || minutes > 59 || seconds > 59) return null;

  const wallAsUtc = new Date(Date.UTC(2026, 5, 15, hours, minutes, seconds));
  const offsetMin = timeZoneOffsetMinutes(wallAsUtc, timeZone);
  let utc = new Date(wallAsUtc.getTime() - offsetMin * 60_000);
  const offsetAtUtc = timeZoneOffsetMinutes(utc, timeZone);
  if (offsetAtUtc !== offsetMin) {
    utc = new Date(wallAsUtc.getTime() - offsetAtUtc * 60_000);
  }

  return `${padTime(utc.getUTCHours())}:${padTime(utc.getUTCMinutes())}:${padTime(utc.getUTCSeconds())}`;
}
