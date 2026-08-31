import { parseApiDateTime } from "@/lib/api/datetime";
import type { ClassSession, ClassSessionStatus } from "@/lib/api/entities/class-session";

const ACTIVE_SESSION_STATUSES = new Set<ClassSessionStatus>([
  "Scheduled",
  "InProgress",
]);

/**
 * QR check-in tokens are Offline (on-site) only.
 * LiveOnline and AssignmentWindow use manual roster updates instead.
 */
export function canGenerateSessionCheckinQr(session: ClassSession): boolean {
  if (session.sessionKind !== "Offline") return false;
  if (!session.requiresAttendance) return false;
  return (
    session.status !== "Completed" && session.status !== "Cancelled"
  );
}

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
      const startMs = parseApiDateTime(session.startTime)?.getTime();
      return startMs != null && startMs >= nowMs;
    }) ??
    getSessionsForActivity(sessions, activityId).find((session) =>
      ACTIVE_SESSION_STATUSES.has(session.status),
    ) ??
    null
  );
}

export function formatClassSessionDateTime(value: string): string {
  const parsed = parseApiDateTime(value) ?? new Date(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
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
  const parsed = parseApiDateTime(value);
  if (!parsed) return "";
  const diffSeconds = (parsed.getTime() - now.getTime()) / 1000;
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
  const parsed = parseApiDateTime(value) ?? new Date(value);
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

const LIVE_JOIN_OPEN_MS = 15 * 60 * 1000;

export type LiveJoinPhase =
  | "cancelled"
  | "locked"
  | "countdown"
  | "live"
  | "recording"
  | "ended";

export type LiveJoinState = {
  phase: LiveJoinPhase;
  joinUrl: string | null;
  msUntilOpen: number;
  msUntilStart: number;
};

function isHttpUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}

/** Prefer `meetingUrl`; fall back to a Location that is already a URL. */
export type LiveJoinSessionInput = Pick<
  ClassSession,
  "status" | "startTime" | "endTime" | "meetingUrl" | "location"
>;

export function resolveSessionJoinUrl(
  session: LiveJoinSessionInput,
): string | null {
  if (isHttpUrl(session.meetingUrl)) return session.meetingUrl;
  if (isHttpUrl(session.location)) return session.location;
  return null;
}

export type JoinCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getJoinCountdownParts(ms: number): JoinCountdownParts {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

/** Compact string for aria / short labels, e.g. "2 ngày 04:12:08" or "12:08". */
export function formatJoinCountdown(ms: number): string {
  const { days, hours, minutes, seconds } = getJoinCountdownParts(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (days > 0) return `${days} ngày ${clock}`;
  if (hours > 0) return clock;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function getLiveJoinState(
  session: LiveJoinSessionInput,
  now = new Date(),
): LiveJoinState {
  const joinUrl = resolveSessionJoinUrl(session);
  const startMs = parseApiDateTime(session.startTime)?.getTime() ?? 0;
  const endMs = parseApiDateTime(session.endTime)?.getTime() ?? startMs;
  const nowMs = now.getTime();
  const openAt = startMs - LIVE_JOIN_OPEN_MS;

  if (session.status === "Cancelled") {
    return { phase: "cancelled", joinUrl, msUntilOpen: 0, msUntilStart: 0 };
  }

  if (session.status === "Completed" || nowMs >= endMs) {
    return {
      phase: joinUrl ? "recording" : "ended",
      joinUrl,
      msUntilOpen: 0,
      msUntilStart: 0,
    };
  }

  if (session.status === "InProgress" || nowMs >= startMs) {
    return { phase: "live", joinUrl, msUntilOpen: 0, msUntilStart: 0 };
  }

  if (nowMs >= openAt) {
    return {
      phase: "countdown",
      joinUrl,
      msUntilOpen: 0,
      msUntilStart: startMs - nowMs,
    };
  }

  return {
    phase: "locked",
    joinUrl,
    msUntilOpen: openAt - nowMs,
    msUntilStart: startMs - nowMs,
  };
}

/**
 * Student self check-in / join actions unlock 15 minutes before start
 * (`countdown` + `live` phases from {@link getLiveJoinState}).
 */
export function isSessionAttendanceWindowOpen(
  session: LiveJoinSessionInput,
  now = new Date(),
): boolean {
  const phase = getLiveJoinState(session, now).phase;
  return phase === "countdown" || phase === "live";
}

/** True when the Meet / join URL may be shown to students. */
export function canRevealSessionJoinUrl(phase: LiveJoinPhase): boolean {
  return phase === "countdown" || phase === "live" || phase === "recording";
}

/** Roster / leave summary, e.g. "45 phút" or "1g 15p". */
export function formatParticipationMinutes(
  minutes: number | null | undefined,
): string {
  if (minutes == null || minutes < 0) return "—";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}g ${remainder}p` : `${hours}g`;
}
