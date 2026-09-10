import type {
  AdvisoryTargetType,
  AdvisoryThreadStatus,
  AdvisoryThreadType,
  ReviewSubmissionStatus,
} from "@/lib/api/entities/program-advisory";
import type { ProgramStatus } from "@/lib/api/entities/program";

/** Vietnamese labels for advisory next-action hints from API. */
export const ADVISORY_NEXT_ACTION_LABELS: Record<string, string> = {
  ReviewSubmission: "Thẩm định lần nộp đang chờ",
  VerifyAddressed: "Xác minh nội dung Manager đã sửa",
  AdviseOptional: "Có thể góp ý khi chương trình đang soạn",
  // Backward-compatible labels for older API fixtures.
  PendingReview: "Chờ quyết định thẩm định",
  ReviewDraft: "Tiếp tục nháp đánh giá",
  UnreadFeedback: "Có góp ý chưa đọc",
  AddressedCorrections: "Có chỉnh sửa cần xem lại",
  AwaitingManager: "Chờ Manager phản hồi",
  None: "Chưa có việc cần xử lý",
};

export function getAdvisoryNextActionLabel(nextAction: string): string {
  const trimmed = nextAction.trim();
  if (!trimmed) return "—";
  return ADVISORY_NEXT_ACTION_LABELS[trimmed] ?? trimmed;
}

export const ADVISORY_THREAD_TYPE_LABELS: Record<AdvisoryThreadType, string> = {
  Suggestion: "Góp ý",
  RequiredChange: "Yêu cầu chỉnh sửa",
};

export const ADVISORY_THREAD_STATUS_LABELS: Record<
  AdvisoryThreadStatus,
  string
> = {
  Open: "Chờ Manager xử lý",
  Addressed: "Chờ chuyên gia xác minh",
  Resolved: "Đã xác minh",
};

export const ADVISORY_TARGET_TYPE_LABELS: Record<AdvisoryTargetType, string> = {
  Program: "Chương trình",
  Module: "Học phần",
  Course: "Khóa học",
  Activity: "Hoạt động",
  Assignment: "Bài tập",
  ResearchMilestone: "Mốc nghiên cứu",
  Material: "Tài liệu",
  RubricCriterion: "Tiêu chí rubric",
};

export const REVIEW_SUBMISSION_STATUS_LABELS: Record<
  ReviewSubmissionStatus,
  string
> = {
  Pending: "Đang thẩm định",
  ChangesRequested: "Yêu cầu chỉnh sửa",
  Approved: "Đã phê duyệt",
  Withdrawn: "Đã rút",
};

/** Priority filter groups for expert program home. */
export const ADVISORY_STATUS_FILTER_OPTIONS: {
  value: string;
  label: string;
  status?: ProgramStatus;
  unreadOnly?: boolean;
}[] = [
  { value: "all", label: "Tất cả" },
  { value: "PendingReview", label: "Chờ quyết định", status: "PendingReview" },
  { value: "Draft", label: "Bản nháp", status: "Draft" },
  { value: "Approved", label: "Đã duyệt", status: "Approved" },
  { value: "Active", label: "Đang mở", status: "Active" },
  { value: "unread", label: "Chưa đọc góp ý", unreadOnly: true },
];
