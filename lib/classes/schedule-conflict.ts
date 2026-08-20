import { parseApiDateTime } from "@/lib/api/datetime";
import type { ClassSession } from "@/lib/api/entities/class-session";
import type { StudentScheduleInterval } from "@/lib/api/me/schemas";
import { formatApiDateTimeDisplay } from "@/lib/curriculum/datetime";

export type ScheduleConflictHit = {
  busy: StudentScheduleInterval;
  candidate: ClassSession;
  label: string;
};

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function formatConflictLabel(
  busy: StudentScheduleInterval,
  candidate: ClassSession,
): string {
  const classLabel =
    busy.className?.trim() || busy.classCode?.trim() || "lớp khác";
  const when =
    formatApiDateTimeDisplay(candidate.startTime) ||
    formatApiDateTimeDisplay(busy.startTime) ||
    "khung giờ trùng";
  return `Trùng lịch với ${classLabel} (${when})`;
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
  const excludeClassId = options?.excludeClassId;

  for (const candidate of candidateSessions) {
    if (candidate.status === "Cancelled") continue;
    const cStart = parseApiDateTime(candidate.startTime);
    const cEnd = parseApiDateTime(candidate.endTime);
    if (!cStart || !cEnd) continue;

    for (const busy of busyIntervals) {
      if (busy.status === "Cancelled") continue;
      if (excludeClassId && busy.classId === excludeClassId) continue;
      const bStart = parseApiDateTime(busy.startTime);
      const bEnd = parseApiDateTime(busy.endTime);
      if (!bStart || !bEnd) continue;
      if (!overlaps(cStart, cEnd, bStart, bEnd)) continue;

      return {
        busy,
        candidate,
        label: formatConflictLabel(busy, candidate),
      };
    }
  }

  return null;
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
