import type { ClassSession, ClassSessionStatus } from "@/lib/api/entities/class-session";

const ACTIVE_SESSION_STATUSES = new Set<ClassSessionStatus>([
  "Scheduled",
  "InProgress",
]);

export function getSessionsForActivity(
  sessions: ClassSession[],
  activityId: string,
): ClassSession[] {
  return sessions
    .filter((session) => session.activityId === activityId)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

export function getNextSessionForActivity(
  sessions: ClassSession[],
  activityId: string,
  now = new Date(),
): ClassSession | null {
  const nowMs = now.getTime();

  return (
    getSessionsForActivity(sessions, activityId).find((session) => {
      if (!ACTIVE_SESSION_STATUSES.has(session.status)) return false;
      return new Date(session.startTime).getTime() >= nowMs;
    }) ??
    getSessionsForActivity(sessions, activityId).find((session) =>
      ACTIVE_SESSION_STATUSES.has(session.status),
    ) ??
    null
  );
}

export function formatClassSessionDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const sessionTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});

const sessionDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

const RELATIVE_DIVISIONS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: "year", seconds: 31_536_000 },
  { unit: "month", seconds: 2_592_000 },
  { unit: "week", seconds: 604_800 },
  { unit: "day", seconds: 86_400 },
  { unit: "hour", seconds: 3_600 },
  { unit: "minute", seconds: 60 },
];

/** Vietnamese relative time, e.g. "2 ngày trước" / "trong 3 giờ". */
export function formatRelativeTime(value: string, now = new Date()): string {
  const diffSeconds = (new Date(value).getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diffSeconds);

  if (abs < 60) return "vừa xong";

  for (const { unit, seconds } of RELATIVE_DIVISIONS) {
    if (abs >= seconds) {
      return relativeTimeFormatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return relativeTimeFormatter.format(Math.round(diffSeconds / 60), "minute");
}

type ScheduleEndpoint = {
  /** Clock time, e.g. "22:18". */
  time: string;
  /** Compact date, e.g. "6 thg 8, 2026". */
  date: string;
};

export type ClassSessionSchedule = {
  start: ScheduleEndpoint;
  end: ScheduleEndpoint | null;
  /** Relative distance of the start from now, e.g. "trong 2 ngày". */
  relative: string;
  /** True when start and end fall on different calendar days. */
  spansMultipleDays: boolean;
};

function toScheduleEndpoint(value: string): ScheduleEndpoint {
  const parsed = new Date(value);
  return {
    time: sessionTimeFormatter.format(parsed),
    date: sessionDateFormatter.format(parsed),
  };
}

/**
 * Breaks a session's start/end into compact date-time parts plus a relative
 * tail, so the UI can render a distinct, minimal timestamp instead of one long
 * date-time run.
 */
export function formatClassSessionSchedule(
  startTime: string,
  endTime?: string | null,
): ClassSessionSchedule {
  const start = toScheduleEndpoint(startTime);
  const end = endTime ? toScheduleEndpoint(endTime) : null;

  return {
    start,
    end,
    relative: formatRelativeTime(startTime),
    spansMultipleDays: end != null && start.date !== end.date,
  };
}
