import type { ClassStatus } from "@/lib/api/entities/class";
import type { ClassSessionKind } from "@/lib/api/entities/class-session";
import type { ClassSessionStatus } from "@/lib/api/entities/class-session";
import type { ClassStudentEnrollmentStatus } from "@/lib/api/entities/class-student";
import type { MediaVideoStatus } from "@/lib/api/entities/media";
import type { SessionAttendanceStatus } from "@/lib/api/entities/session-attendance";

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  Draft: "Bản nháp",
  ReadyForMentor: "Chờ mentor",
  Open: "Đang tuyển sinh",
  InProgress: "Đang học",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

export const CLASS_SESSION_KIND_LABELS: Record<ClassSessionKind, string> = {
  Lesson: "Lesson",
  FieldTrip: "Field Trip",
  AssignmentWindow: "Assignment",
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

/** Attendance statuses eligible for `mentor-complete-bulk` after điểm danh. */
export const MENTOR_COMPLETE_ELIGIBLE_ATTENDANCE_STATUSES: ReadonlySet<SessionAttendanceStatus> =
  new Set(["Present", "Late", "Excused"]);

export const CLASS_STUDENT_ENROLLMENT_STATUS_LABELS: Record<
  ClassStudentEnrollmentStatus,
  string
> = {
  Active: "Đang học",
  Transferred: "Đã chuyển lớp",
  Withdrawn: "Đã rút",
  Completed: "Hoàn thành",
};

export const MEDIA_VIDEO_STATUS_LABELS: Record<MediaVideoStatus, string> = {
  None: "Ảnh / sẵn sàng",
  Transcoding: "Đang chuyển mã",
  PendingTagging: "Chờ gắn thẻ mặt",
  TaggingComplete: "Đã gắn thẻ",
  Failed: "Lỗi xử lý",
};

export const MEDIA_ACCEPT =
  "image/jpeg,image/jpg,image/png,video/mp4,video/quicktime";

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

/**
 * Mentor board / request: ReadyForMentor classes with no assigned mentor.
 * The board API applies the same filter; this is a client guard.
 */
export function isMentorBoardClass(status: ClassStatus): boolean {
  return status === "ReadyForMentor";
}

/** Student class picker / enroll — only Open cohorts are joinable. */
export function isStudentJoinableClass(status: ClassStatus): boolean {
  return status === "Open";
}

export const CLASS_SESSIONS_QUERY = {
  page: 1,
  pageSize: 200,
  sortBy: "startTime" as const,
  isDescending: false,
};

export type ClassLifecycleAction = "ready" | "open" | "start" | "complete";

/** Next lifecycle action available for a class status, if any. */
export function getNextClassLifecycleAction(
  status: ClassStatus,
): { action: ClassLifecycleAction; label: string } | null {
  if (status === "Draft") {
    return { action: "ready", label: "Sẵn sàng tìm mentor" };
  }
  if (status === "ReadyForMentor") {
    return { action: "open", label: "Mở tuyển sinh" };
  }
  if (status === "Open") return { action: "start", label: "Bắt đầu lớp" };
  if (status === "InProgress") {
    return { action: "complete", label: "Hoàn thành lớp" };
  }
  return null;
}
