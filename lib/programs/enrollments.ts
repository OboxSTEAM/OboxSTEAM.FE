import type {
  ProgramEnrollment,
  ProgramEnrollmentStatus,
} from "@/lib/api/entities/program-enrollment";
import type { MyProgramEnrollmentsQuery } from "@/lib/api/program-enrollments";

export type ProgramDetailEnrollmentCta =
  | { kind: "enroll" }
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
  return enrollments.find((enrollment) => enrollment.programId === programId) ?? null;
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
  if (
    !enrollment ||
    enrollment.status === "Dropped" ||
    enrollment.status === "Failed"
  ) {
    return { kind: "enroll" };
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
        label: "Tiếp tục học",
        subtext: "Tiếp tục từ nơi bạn dừng lại.",
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
