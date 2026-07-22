import type { ClassStatus } from "@/lib/api/entities/class";
import type { ClassSessionKind } from "@/lib/api/entities/class-session";
import type { ClassSessionStatus } from "@/lib/api/entities/class-session";
import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  Draft: "Bản nháp",
  Open: "Đang tuyển sinh",
  InProgress: "Đang học",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

export const CLASS_SESSION_KIND_LABELS: Record<ClassSessionKind, string> = {
  Lesson: "Buổi học",
  FieldTrip: "Thực địa",
  AssignmentWindow: "Bài tập",
  MentorCheckIn: "Gặp mentor",
};

export const CLASS_SESSION_STATUS_LABELS: Record<ClassSessionStatus, string> = {
  Scheduled: "Đã lên lịch",
  InProgress: "Đang diễn ra",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

export const ATTENDANCE_STATUS_LABELS: Record<SessionAttendanceStatus, string> = {
  Expected: "Chờ điểm danh",
  Present: "Có mặt",
  Absent: "Vắng",
  Excused: "Có phép",
  Late: "Đi muộn",
};

export const CLASS_MENTOR_REQUEST_STATUS_LABELS = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Withdrawn: "Đã rút",
} as const;

/** Note applied when auto-rejecting remaining pending requests after an approve. */
export const AUTO_REJECT_AFTER_APPROVE_NOTE =
  "Lớp đã được gán mentor khác.";

export const OPEN_CLASSES_QUERY = {
  page: 1,
  pageSize: 50,
  status: "Open" as const,
};

export const CLASS_SESSIONS_QUERY = {
  page: 1,
  pageSize: 200,
  sortBy: "startTime" as const,
  isDescending: false,
};

/** Next lifecycle action available for a class status, if any. */
export function getNextClassLifecycleAction(
  status: ClassStatus,
): { action: "open" | "start" | "complete"; label: string } | null {
  if (status === "Draft") return { action: "open", label: "Mở tuyển sinh" };
  if (status === "Open") return { action: "start", label: "Bắt đầu lớp" };
  if (status === "InProgress") return { action: "complete", label: "Hoàn thành lớp" };
  return null;
}
