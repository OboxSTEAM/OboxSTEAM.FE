import { parseApiDateTime } from "@/lib/api/datetime";
import type { Class } from "@/lib/api/entities/class";
import type { ClassSession } from "@/lib/api/entities/class-session";

/** Manager create-class lead time: `StartDate ≥ UtcNow.Date + 14 days`. */
export const CLASS_CREATE_LEAD_DAYS = 14;

/** Default duration for LiveOnline/Offline activity templates. */
export const DEFAULT_LIVE_ACTIVITY_DURATION_MINUTES = 90;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getMinClassStartDate(): Date {
  const min = startOfLocalDay(new Date());
  min.setDate(min.getDate() + CLASS_CREATE_LEAD_DAYS);
  return min;
}

/** `datetime-local` min value for creating a class. */
export function getMinClassStartLocalInput(): string {
  const min = getMinClassStartDate();
  return `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}T00:00`;
}

export function isLocalInputOnOrAfterLeadTime(localInput: string): boolean {
  const parsed = new Date(localInput);
  if (Number.isNaN(parsed.getTime())) return false;
  return startOfLocalDay(parsed).getTime() >= getMinClassStartDate().getTime();
}

/** Open/Start require `StartDate > UtcNow`. */
export function isApiDateTimeInFuture(value: string | null | undefined): boolean {
  const parsed = parseApiDateTime(value);
  if (!parsed) return false;
  return parsed.getTime() > Date.now();
}

export function isActiveClassSession(
  session: Pick<ClassSession, "status">,
): boolean {
  return session.status !== "Cancelled";
}

export function countActiveClassSessions(
  sessions: Pick<ClassSession, "status">[],
): number {
  return sessions.filter(isActiveClassSession).length;
}

export function getOccupiedCurriculumItemIds(
  sessions: Pick<ClassSession, "id" | "status" | "activityId" | "assignmentId">[],
  excludeSessionId?: string | null,
): { activityIds: Set<string>; assignmentIds: Set<string> } {
  const activityIds = new Set<string>();
  const assignmentIds = new Set<string>();
  for (const session of sessions) {
    if (excludeSessionId && session.id === excludeSessionId) continue;
    if (!isActiveClassSession(session)) continue;
    if (session.activityId) activityIds.add(session.activityId);
    if (session.assignmentId) assignmentIds.add(session.assignmentId);
  }
  return { activityIds, assignmentIds };
}

export function canGenerateClassSessions(input: {
  seatsTaken: number;
  activeSessionCount: number;
}): { ok: true } | { ok: false; reason: string } {
  if (input.seatsTaken > 0) {
    return {
      ok: false,
      reason: "Không tạo lại lịch khi lớp đã có học viên.",
    };
  }
  if (input.activeSessionCount > 0) {
    return {
      ok: false,
      reason: "Xóa hoặc hủy buổi đang active trước khi tạo lịch lại.",
    };
  }
  return { ok: true };
}

/** Draft → ReadyForMentor: coverage + future StartDate (no mentor required). */
export function getReadyForMentorBlockers(input: {
  activeSessionCount: number;
  startDate: string;
}): string[] {
  const blockers: string[] = [];
  if (input.activeSessionCount <= 0) {
    blockers.push("Chưa có lịch học khớp khung chương trình");
  }
  if (!isApiDateTimeInFuture(input.startDate)) {
    blockers.push("Ngày bắt đầu đã quá hạn — hãy dời lịch lớp rồi mới mở bảng mentor");
  }
  return blockers;
}

export function getReadyForMentorBlockersFromClass(
  classItem: Pick<Class, "startDate">,
  activeSessionCount: number,
): string[] {
  return getReadyForMentorBlockers({
    activeSessionCount,
    startDate: classItem.startDate,
  });
}

/** ReadyForMentor → Open: mentor + coverage + future StartDate. */
export function getOpenClassBlockers(input: {
  mentorId: string | null;
  activeSessionCount: number;
  startDate: string;
}): string[] {
  const blockers: string[] = [];
  if (!input.mentorId) {
    blockers.push("Chưa gán mentor");
  }
  if (input.activeSessionCount <= 0) {
    blockers.push("Chưa có lịch học khớp khung chương trình");
  }
  if (!isApiDateTimeInFuture(input.startDate)) {
    blockers.push("Ngày bắt đầu đã quá hạn — hãy dời lịch lớp rồi mới mở");
  }
  return blockers;
}

export function getOpenClassBlockersFromClass(
  classItem: Pick<Class, "mentorId" | "startDate">,
  activeSessionCount: number,
): string[] {
  return getOpenClassBlockers({
    mentorId: classItem.mentorId,
    activeSessionCount,
    startDate: classItem.startDate,
  });
}
