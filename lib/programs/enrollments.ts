import type { ProgramEnrollmentStatus } from "@/lib/api/entities/program-enrollment";
import type { MyProgramEnrollmentsQuery } from "@/lib/api/program-enrollments";

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
