import type {
  AdvisoryTargetType,
  AdvisoryThreadAction,
  AdvisoryThreadEvent,
  AdvisoryThreadStatus,
  AdvisoryThreadType,
  ReviewSubmissionStatus,
} from "@/lib/api/entities/program-advisory";
import type { ProgramStatus } from "@/lib/api/entities/program";

/** Vietnamese labels for advisory next-action hints from API. */
export const ADVISORY_NEXT_ACTION_LABELS: Record<string, string> = {
  ReviewSubmission: "Thẩm định lần nộp đang chờ",
  FixRequiredChanges: "Đánh dấu Đã sửa cho các mục bắt buộc",
  ResubmitReady: "Gửi lại thẩm định",
  Publish: "Xuất bản chương trình",
  AdviseOptional: "Có thể gửi nhận xét khi chương trình đang soạn",
  PendingReview: "Chờ quyết định thẩm định",
  ReviewDraft: "Tiếp tục nháp đánh giá",
  UnreadFeedback: "Có nhận xét chưa đọc",
  AddressedCorrections: "Có chỉnh sửa cần xem lại",
  AwaitingManager: "Chờ Manager phản hồi",
  None: "Chưa có việc cần xử lý",
};

/** Compact labels for dense tables — full copy stays in ADVISORY_NEXT_ACTION_LABELS. */
export const ADVISORY_NEXT_ACTION_SHORT_LABELS: Record<string, string> = {
  ReviewSubmission: "Chờ thẩm định",
  FixRequiredChanges: "Cần sửa",
  ResubmitReady: "Sẵn sàng gửi lại",
  Publish: "Xuất bản",
  AdviseOptional: "Có thể nhận xét",
  PendingReview: "Chờ quyết định",
  ReviewDraft: "Tiếp tục nháp",
  UnreadFeedback: "Chưa đọc",
  AddressedCorrections: "Cần xem lại",
  AwaitingManager: "Chờ Manager",
  None: "Không việc mới",
};

export function getAdvisoryNextActionLabel(nextAction: string): string {
  const trimmed = nextAction.trim();
  if (!trimmed) return "—";
  return ADVISORY_NEXT_ACTION_LABELS[trimmed] ?? trimmed;
}

export function getAdvisoryNextActionShortLabel(nextAction: string): string {
  const trimmed = nextAction.trim();
  if (!trimmed) return "—";
  return (
    ADVISORY_NEXT_ACTION_SHORT_LABELS[trimmed] ??
    ADVISORY_NEXT_ACTION_LABELS[trimmed] ??
    trimmed
  );
}

export const ADVISORY_THREAD_TYPE_LABELS: Record<AdvisoryThreadType, string> = {
  Suggestion: "Gợi ý",
  RequiredChange: "Bắt buộc sửa",
  General: "Trao đổi chung",
};

export const ADVISORY_THREAD_ACTION_LABELS: Record<AdvisoryThreadAction, string> = {
  MarkFixed: "Đã sửa",
  Acknowledge: "Đã ghi nhận",
  Accept: "Chấp nhận",
};

export function getThreadStatusLabel(
  type: AdvisoryThreadType,
  status: AdvisoryThreadStatus,
): string {
  if (type === "General") return "Đang mở";
  if (type === "Suggestion") {
    return status === "Resolved" ? "Đã ghi nhận" : "Gợi ý";
  }
  if (status === "Open") return "Cần sửa";
  if (status === "Addressed") return "Đã sửa · chờ chuyên gia";
  return "Đã chấp nhận";
}

export function describeAdvisoryEvent(event: AdvisoryThreadEvent): string {
  const note = event.message?.trim();
  if (event.eventType === "Created") return "Đã tạo nhận xét";
  if (event.eventType === "CorrectionSubmitted" || (event.newStatus === "Addressed" && event.priorStatus === "Open")) {
    return note?.toLowerCase().includes("đã sửa") ? note : "Manager đã đánh dấu Đã sửa";
  }
  if (event.eventType === "VerificationRecorded" || event.resolutionKind === "Verified") {
    if (note?.toLowerCase().includes("phê duyệt") || note?.toLowerCase().includes("approval")) {
      return "Chuyên gia đã chấp nhận khi phê duyệt";
    }
    return "Chuyên gia đã chấp nhận";
  }
  if (event.eventType === "WaiverRecorded" || event.resolutionKind === "Waived") {
    return "Đã ghi nhận miễn trừ (lịch sử)";
  }
  if (event.newStatus === "Open" && event.priorStatus === "Addressed") {
    return note || "Chuyên gia trả về: chưa đạt";
  }
  if (event.newStatus === "Resolved" && event.priorStatus === "Open") {
    return "Đã ghi nhận";
  }
  return note || "Có cập nhật trên nhận xét";
}

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
  ChangesRequested: "Đã trả về chỉnh sửa",
  Approved: "Đã phê duyệt",
  Withdrawn: "Đã rút",
};

export const CHANGE_KIND_LABELS: Record<
  "added" | "removed" | "modified" | "reordered",
  string
> = {
  added: "Mới",
  removed: "Đã gỡ",
  modified: "Đã sửa",
  reordered: "Đổi thứ tự",
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
  { value: "unread", label: "Chưa đọc nhận xét", unreadOnly: true },
];
