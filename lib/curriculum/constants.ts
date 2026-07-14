import type { ActivityNavStatus, ActivityType } from "@/lib/api";
import type {
  AssignmentType,
  EnrollmentAssignmentStatus,
} from "@/lib/api/entities/assignment";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  SelfPaced: "Tự học",
  LiveOnline: "Trực tuyến",
  Offline: "Thực hành",
};

export const ACTIVITY_TITLE_PREFIX: Record<ActivityType, string> = {
  SelfPaced: "Đọc/Xem",
  LiveOnline: "Buổi học",
  Offline: "Thực hành",
};

export const ACTIVITY_NAV_STATUS_META: Record<
  ActivityNavStatus,
  { label: string; icon: "check" | "current" | "available" | "locked" }
> = {
  completed: { label: "Đã hoàn thành", icon: "check" },
  current: { label: "Đang học", icon: "current" },
  available: { label: "Có thể học", icon: "available" },
  locked: { label: "Đã khóa", icon: "locked" },
};

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  Quiz: "Trắc nghiệm",
  Retrospective: "Đánh giá",
  FileUpload: "Nộp bài",
};

export const ASSIGNMENT_TITLE_PREFIX: Record<AssignmentType, string> = {
  Quiz: "Bài kiểm tra",
  Retrospective: "Bài tập",
  FileUpload: "Bài nộp",
};

export const ASSIGNMENT_STATUS_META: Record<
  EnrollmentAssignmentStatus,
  { label: string; icon: "check" | "available" | "locked" | "pending" }
> = {
  available: { label: "Có thể làm", icon: "available" },
  locked: { label: "Đã khóa", icon: "locked" },
  submitted: { label: "Đã nộp", icon: "pending" },
  completed: { label: "Đã đạt", icon: "check" },
};

/** Scroll/video completion thresholds. */
export const SCROLL_COMPLETE_EPSILON = 0.02;
export const VIDEO_COMPLETE_EPSILON_SECONDS = 1;
export const CHECKPOINT_DEBOUNCE_MS = 1500;
/** How often embedded PDF/DOC iframes are polled for page + scroll changes. */
export const EMBEDDED_FRAME_POLL_MS = 500;
/** Minimum interval between video checkpoint PATCH calls during playback. */
export const VIDEO_CHECKPOINT_INTERVAL_MS = 10_000;
/** Skip video checkpoint when position has not advanced by this many seconds. */
export const VIDEO_CHECKPOINT_MIN_DELTA_SECONDS = 1;

/** Debounce draft quiz answer saves while the student selects options. */
export const QUIZ_ANSWER_SAVE_DEBOUNCE_MS = 800;

/** Debounce retrospective draft autosave while the student types. */
export const RETROSPECTIVE_DRAFT_SAVE_DEBOUNCE_MS = 1200;

/** Research milestone file upload limits (client-side). */
export const RESEARCH_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const RESEARCH_UPLOAD_MAX_EVIDENCE = 10;
export const RESEARCH_UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.txt";
