import { parseApiDateTime } from "@/lib/api/datetime";
import type { ClassSession } from "@/lib/api/entities/class-session";
import type { StudentScheduleInterval } from "@/lib/api/me/schemas";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";

export type ScheduleConflictHit = {
  busy: StudentScheduleInterval;
  candidate: ClassSession;
  label: string;
};

/** Minimal session shape for open-enrollment / timetable conflict checks. */
export type ScheduleTimedSession = {
  startTime: string;
  endTime: string;
  /** When present, Cancelled sessions are ignored. */
  status?: string | null;
};

export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function formatConflictLabel(
  busy: StudentScheduleInterval,
  candidateStartTime: string,
): string {
  const classLabel =
    busy.className?.trim() || busy.classCode?.trim() || "lớp khác";
  const when =
    formatApiDateTimeDisplay(candidateStartTime) ||
    formatApiDateTimeDisplay(busy.startTime) ||
    "khung giờ trùng";
  return `Trùng lịch với ${classLabel} (${when})`;
}

function isCancelledStatus(status: string | null | undefined): boolean {
  return status === "Cancelled";
}

/**
 * First overlap between candidate sessions and the student's busy schedule.
 * Cancelled intervals/sessions are ignored.
 */
export function findBusyScheduleConflict(
  candidateSessions: ScheduleTimedSession[],
  busyIntervals: StudentScheduleInterval[],
  options?: { excludeClassId?: string },
): { busy: StudentScheduleInterval; candidate: ScheduleTimedSession; label: string } | null {
  const excludeClassId = options?.excludeClassId;

  for (const candidate of candidateSessions) {
    if (isCancelledStatus(candidate.status)) continue;
    const cStart = parseApiDateTime(candidate.startTime);
    const cEnd = parseApiDateTime(candidate.endTime);
    if (!cStart || !cEnd) continue;

    for (const busy of busyIntervals) {
      if (isCancelledStatus(busy.status)) continue;
      if (excludeClassId && busy.classId === excludeClassId) continue;
      const bStart = parseApiDateTime(busy.startTime);
      const bEnd = parseApiDateTime(busy.endTime);
      if (!bStart || !bEnd) continue;
      if (!overlaps(cStart, cEnd, bStart, bEnd)) continue;

      return {
        busy,
        candidate,
        label: formatConflictLabel(busy, candidate.startTime),
      };
    }
  }

  return null;
}

/** First conflict label, or null. */
export function findBusyConflictLabel(
  candidateSessions: ScheduleTimedSession[],
  busyIntervals: StudentScheduleInterval[],
  options?: { excludeClassId?: string },
): string | null {
  return findBusyScheduleConflict(candidateSessions, busyIntervals, options)
    ?.label ?? null;
}

/**
 * Session ids (when present) that overlap any busy interval.
 * Sessions without `sessionId` are skipped in the set (label still works via findBusy*).
 */
export function getConflictingSessionIds(
  candidateSessions: Array<ScheduleTimedSession & { sessionId?: string }>,
  busyIntervals: StudentScheduleInterval[],
  options?: { excludeClassId?: string },
): Set<string> {
  const excludeClassId = options?.excludeClassId;
  const ids = new Set<string>();

  for (const candidate of candidateSessions) {
    if (!candidate.sessionId || isCancelledStatus(candidate.status)) continue;
    const cStart = parseApiDateTime(candidate.startTime);
    const cEnd = parseApiDateTime(candidate.endTime);
    if (!cStart || !cEnd) continue;

    for (const busy of busyIntervals) {
      if (isCancelledStatus(busy.status)) continue;
      if (excludeClassId && busy.classId === excludeClassId) continue;
      const bStart = parseApiDateTime(busy.startTime);
      const bEnd = parseApiDateTime(busy.endTime);
      if (!bStart || !bEnd) continue;
      if (!overlaps(cStart, cEnd, bStart, bEnd)) continue;
      ids.add(candidate.sessionId);
      break;
    }
  }

  return ids;
}

/**
 * Find first overlap between a candidate class session and the student's busy
 * schedule. Cancelled sessions on either side are ignored.
 */
export function findScheduleConflict(
  candidateSessions: ClassSession[],
  busyIntervals: StudentScheduleInterval[],
  options?: { excludeClassId?: string },
): ScheduleConflictHit | null {
  const hit = findBusyScheduleConflict(
    candidateSessions,
    busyIntervals,
    options,
  );
  if (!hit) return null;
  return {
    busy: hit.busy,
    candidate: hit.candidate as ClassSession,
    label: hit.label,
  };
}

/** Upcoming non-cancelled sessions, soonest first (max `limit`). */
export function pickUpcomingSessions(
  sessions: ClassSession[],
  limit = 4,
): ClassSession[] {
  const now = Date.now();
  return [...sessions]
    .filter((session) => session.status !== "Cancelled")
    .sort((a, b) => {
      const aTime = parseApiDateTime(a.startTime)?.getTime() ?? 0;
      const bTime = parseApiDateTime(b.startTime)?.getTime() ?? 0;
      return aTime - bTime;
    })
    .filter((session) => {
      const end = parseApiDateTime(session.endTime)?.getTime();
      return end == null || end >= now;
    })
    .slice(0, limit);
}
