import type { ModuleEnrollmentStatus } from "@/lib/api/entities/module-enrollment";
import type { ModuleType } from "@/lib/api/entities/module";
import type {
  ParentBlockerCode,
  ParentModuleOutcomeLabel,
  ParentProgressEventType,
} from "@/lib/api/entities/parent-progression";
import type { ProgramEnrollmentStatus } from "@/lib/api/entities/program-enrollment";
import { PROGRAM_ENROLLMENT_STATUS_LABELS } from "@/lib/programs/enrollments";

export function getParentChildProgressionHref(studentId: string): string {
  return `/parent/children/${studentId}`;
}

export function getParentEnrollmentProgressionHref(
  studentId: string,
  enrollmentId: string,
): string {
  return `/parent/children/${studentId}/programs/${enrollmentId}`;
}

export function getParentLinkedDisplayName(account: {
  fullName: string | null;
  email: string | null;
}): string {
  if (account.fullName?.trim()) return account.fullName.trim();
  const email = account.email?.trim();
  if (email) return email.split("@")[0] ?? "HV";
  return "Học viên";
}

export function getParentLinkedInitials(account: {
  fullName: string | null;
  email: string | null;
}): string {
  const name = getParentLinkedDisplayName(account);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Formats ISO or BE `dd/MM/yyyy HH:mm:ss` style dates for parent UI. */
export function formatParentDate(value: string | null | undefined): string {
  if (!value?.trim()) return "—";

  const parsed = parseParentDate(value);
  if (!parsed) return value;

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsed);
  } catch {
    return value;
  }
}

export function formatParentDateTime(value: string | null | undefined): string {
  if (!value?.trim()) return "—";

  const parsed = parseParentDate(value);
  if (!parsed) return value;

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  } catch {
    return value;
  }
}

function parseParentDate(value: string): Date | null {
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) return iso;

  const match = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function clampProgressPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export const MODULE_ENROLLMENT_STATUS_LABELS: Record<
  ModuleEnrollmentStatus,
  string
> = {
  PendingPayment: "Chờ thanh toán",
  Active: "Đang học",
  Deferred: "Tạm hoãn",
  Completed: "Hoàn thành",
  Failed: "Không đạt",
  Dropped: "Đã hủy",
};

export const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  Theory: "Lý thuyết",
  Experiential: "Trải nghiệm",
  Research: "Nghiên cứu",
};

export const PARENT_MODULE_OUTCOME_LABELS: Record<
  ParentModuleOutcomeLabel,
  string
> = {
  Excellent: "Xuất sắc",
  Pass: "Đạt",
  NeedsImprovement: "Cần cải thiện",
  Failed: "Không đạt",
  InProgress: "Đang học",
  NotStarted: "Chưa bắt đầu",
};

export const PARENT_PROGRESS_EVENT_LABELS: Record<
  ParentProgressEventType,
  string
> = {
  ActivityCompleted: "Hoàn thành hoạt động",
  AssignmentSubmitted: "Đã nộp bài",
  AssignmentPassed: "Đạt bài tập",
  AssignmentFailed: "Chưa đạt bài tập",
  ModuleCompleted: "Hoàn thành module",
  ModuleFailed: "Module không đạt",
  EnrollmentCompleted: "Hoàn thành chương trình",
};

export const PARENT_BLOCKER_FALLBACK_LABELS: Record<ParentBlockerCode, string> =
  {
    ModuleLocked: "Module đang bị khóa",
    PrerequisiteFailed: "Chưa đạt module tiên quyết",
    PendingPayment: "Chờ thanh toán",
    AssignmentOverdue: "Bài tập quá hạn",
    ModuleFailed: "Module không đạt",
  };

export function getProgramEnrollmentStatusLabel(
  status: ProgramEnrollmentStatus,
): string {
  return PROGRAM_ENROLLMENT_STATUS_LABELS[status];
}

export function getAssignmentStatusLabel(status: string | null): string {
  if (!status) return "—";
  switch (status.toLowerCase()) {
    case "locked":
      return "Đang khóa";
    case "available":
      return "Có thể làm";
    case "submitted":
      return "Đã nộp";
    case "completed":
      return "Hoàn thành";
    case "overdue":
      return "Quá hạn";
    default:
      return status;
  }
}

export function getEnrollmentStatusPillClass(
  status: ProgramEnrollmentStatus,
): string {
  switch (status) {
    case "Active":
      return "border-[#7CB342]/40 bg-[#7CB342]/18 text-[#2d5016]";
    case "PendingPayment":
      return "border-[#E94B3C]/35 bg-[#FFF0EE] text-[#B71C1C]";
    case "Deferred":
      return "border-[#FDD835]/45 bg-[#FFF8E1] text-[#8A7200]";
    case "Completed":
      return "border-[#4FC3F7]/45 bg-[#E8F7FD] text-[#1565c0]";
    case "Failed":
      return "border-[#E94B3C]/40 bg-[#FFF0EE] text-[#a82a1e]";
    case "Dropped":
      return "border-[#D4D4CF] bg-[#F5F5F0] text-[#6B6B6B]";
    default:
      return "border-[#E5E5E0] bg-white text-[#2D2D2D]";
  }
}

export function getOutcomeLabelClass(
  outcome: ParentModuleOutcomeLabel | null,
): string {
  switch (outcome) {
    case "Excellent":
    case "Pass":
      return "text-[#3d5c22]";
    case "NeedsImprovement":
      return "text-[#8A7200]";
    case "Failed":
      return "text-[#a82a1e]";
    case "InProgress":
      return "text-[#1565c0]";
    default:
      return "text-[#6B6B6B]";
  }
}
