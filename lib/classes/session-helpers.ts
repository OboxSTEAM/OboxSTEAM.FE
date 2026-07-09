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
