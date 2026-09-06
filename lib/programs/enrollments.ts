import type {
  ProgramEnrollment,
  ProgramEnrollmentEndReason,
  ProgramEnrollmentStatus,
} from "@/lib/api/entities/program-enrollment";
import type { MyProgramEnrollmentsQuery } from "@/lib/api/program-enrollments";

export type ProgramDetailEnrollmentCta =
  | { kind: "enroll" }
  | {
      kind: "rebuy";
      label: string;
      subtext: string;
    }
  | {
      kind: "continue" | "review";
      href: string;
      label: string;
      subtext: string;
    }
  | {
      kind: "complete-payment";
      label: string;
      subtext: string;
    }
  | {
      kind: "deferred";
      label: string;
      subtext: string;
    };

export function findEnrollmentForProgram(
  enrollments: ProgramEnrollment[],
  programId: string,
): ProgramEnrollment | null {
  const matches = enrollments.filter(
    (enrollment) => enrollment.programId === programId,
  );
  if (matches.length === 0) return null;
  return (
    matches.find((enrollment) => !enrollment.isSuperseded) ?? matches[0] ?? null
  );
}

export function getProgramLearnHref(programId: string): string {
  return `/programs/${programId}/learn`;
}

export function canAccessProgramLearn(
  status: ProgramEnrollmentStatus,
): boolean {
  return status === "Active" || status === "Completed";
}

export function showsEnrollmentProgress(
  enrollment: ProgramEnrollment | null | undefined,
): enrollment is ProgramEnrollment {
  return (
    enrollment != null &&
    (enrollment.status === "Active" || enrollment.status === "Completed")
  );
}

export const PROGRAM_DETAIL_ENROLLMENTS_LOOKUP_QUERY: MyProgramEnrollmentsQuery = {
  page: 1,
  pageSize: 100,
  sortBy: "enrolledAt",
  isDescending: true,
};

export function resolveProgramDetailEnrollmentCta(
  enrollment: ProgramEnrollment | null,
): ProgramDetailEnrollmentCta {
  if (!enrollment) {
    return { kind: "enroll" };
  }

  if (enrollment.status === "Dropped" || enrollment.status === "Failed") {
    return {
      kind: "rebuy",
      label: "Đăng ký lại",
      subtext:
        "Trong 1 tháng: học lại với nửa học phí (50%), và có thể vào lớp đang chạy nếu còn chỗ.\nNếu quá 1 tháng: đóng đủ học phí (100%) và chỉ đăng ký được lớp mới mở tuyển sinh.",
    };
  }

  switch (enrollment.status) {
    case "PendingPayment":
      return {
        kind: "complete-payment",
        label: "Hoàn tất thanh toán",
        subtext: "Ghế/link hết hạn sau 5 phút.",
      };
    case "Deferred":
      return {
        kind: "deferred",
        label: "Đang tạm hoãn",
        subtext: "Chương trình của bạn đang tạm dừng. Liên hệ hỗ trợ nếu cần.",
      };
    case "Completed":
      return {
        kind: "review",
        href: getProgramLearnHref(enrollment.programId),
        label: "Xem lại khóa học",
        subtext: "Xem lại nội dung chương trình.",
      };
    case "Active":
      return {
        kind: "continue",
        href: getProgramLearnHref(enrollment.programId),
        label: enrollment.isRebuy ? "Tiếp tục học lại" : "Tiếp tục học",
        subtext: enrollment.isRebuy
          ? getRebuyContinueSubtext(enrollment)
          : "Tiếp tục từ nơi bạn dừng lại.",
      };
    default:
      return { kind: "enroll" };
  }
}

export const PROGRAM_ENROLLMENT_STATUS_LABELS: Record<
  ProgramEnrollmentStatus,
  string
> = {
  PendingPayment: "Chờ thanh toán",
  Active: "Đang học",
  Deferred: "Tạm hoãn",
  Completed: "Hoàn thành",
  Failed: "Không đạt",
  Dropped: "Đã hủy",
};

export const PROGRAM_ENROLLMENT_END_REASON_LABELS: Record<
  ProgramEnrollmentEndReason,
  string
> = {
  AcademicFail: "không đạt",
  Withdraw: "hủy đăng ký",
  Attendance: "vắng học",
};

/** Status pill / progress label — surfaces rebuy while Active. */
export function getEnrollmentDisplayStatusLabel(
  enrollment: ProgramEnrollment,
): string {
  if (enrollment.isRebuy && enrollment.status === "Active") {
    return enrollment.attemptNumber > 1
      ? `Đang học lại · lần ${enrollment.attemptNumber}`
      : "Đang học lại";
  }
  if (enrollment.isRebuy && enrollment.status === "PendingPayment") {
    return "Đăng ký lại · chờ thanh toán";
  }
  return PROGRAM_ENROLLMENT_STATUS_LABELS[enrollment.status];
}

export function getEnrollmentRebuyHint(
  enrollment: ProgramEnrollment,
): string | null {
  if (!enrollment.isRebuy) return null;

  const prior =
    enrollment.priorEndReason != null
      ? PROGRAM_ENROLLMENT_END_REASON_LABELS[enrollment.priorEndReason]
      : enrollment.priorStatus === "Failed"
        ? "không đạt"
        : enrollment.priorStatus === "Dropped"
          ? "hủy đăng ký"
          : null;

  if (prior) {
    return enrollment.attemptNumber > 1
      ? `Học lại lần ${enrollment.attemptNumber} · sau khi ${prior}`
      : `Học lại sau khi ${prior}`;
  }

  return enrollment.attemptNumber > 1
    ? `Học lại lần ${enrollment.attemptNumber}`
    : "Đang học lại chương trình này";
}

function getRebuyContinueSubtext(enrollment: ProgramEnrollment): string {
  const hint = getEnrollmentRebuyHint(enrollment);
  return hint ?? "Tiếp tục học lại từ tiến độ đã giữ.";
}

export const DEFAULT_MY_ENROLLMENTS_QUERY: MyProgramEnrollmentsQuery = {
  page: 1,
  pageSize: 9,
  sortBy: "enrolledAt",
  isDescending: true,
};

export type MyEnrollmentsSortOption = {
  id: string;
  label: string;
  sortBy: NonNullable<MyProgramEnrollmentsQuery["sortBy"]>;
  isDescending: boolean;
};

export const MY_ENROLLMENTS_SORT_OPTIONS: MyEnrollmentsSortOption[] = [
  {
    id: "enrolledAt-desc",
    label: "Đăng ký mới nhất",
    sortBy: "enrolledAt",
    isDescending: true,
  },
  {
    id: "progressPercent-desc",
    label: "Tiến độ cao nhất",
    sortBy: "progressPercent",
    isDescending: true,
  },
  {
    id: "status-asc",
    label: "Trạng thái",
    sortBy: "status",
    isDescending: false,
  },
];

export function getMyEnrollmentsSortOptionId(
  query: MyProgramEnrollmentsQuery,
): string {
  const match = MY_ENROLLMENTS_SORT_OPTIONS.find(
    (option) =>
      option.sortBy === query.sortBy &&
      option.isDescending === query.isDescending,
  );

  return match?.id ?? MY_ENROLLMENTS_SORT_OPTIONS[0].id;
}
