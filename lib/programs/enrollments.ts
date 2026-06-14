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
    };

export function findEnrollmentForProgram(
  enrollments: ProgramEnrollment[],
  programId: string,
): ProgramEnrollment | null {
  return enrollments.find((enrollment) => enrollment.programId === programId) ?? null;
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
  if (!enrollment || enrollment.status === "Cancelled") {
    return { kind: "enroll" };
  }

  switch (enrollment.status) {
    case "PendingPayment":
      return {
        kind: "complete-payment",
        label: "Hoàn tất thanh toán",
        subtext: "Đăng ký của bạn đang chờ thanh toán.",
      };
    case "Completed":
      return {
        kind: "review",
        href: "/courses",
        label: "Xem lại khóa học",
        subtext: "Bạn đã hoàn thành chương trình này.",
      };
    case "Active":
      return {
        kind: "continue",
        href: "/courses",
        label: "Tiếp tục học",
        subtext: "Tiếp tục từ Khóa học của tôi.",
      };
    default:
      return { kind: "enroll" };
  }
}

export const PROGRAM_ENROLLMENT_STATUS_LABELS: Record<
  ProgramEnrollmentStatus,
  string
> = {
  Active: "Đang học",
  PendingPayment: "Chờ thanh toán",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
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
