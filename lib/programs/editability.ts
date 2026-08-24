import { getClasses } from "@/lib/api/classes";

export type ProgramCohortLock = {
  locked: boolean;
  reason: string | null;
};

/**
 * Mirrors BE CurriculumEditGuard / program PUT-DELETE 409 rules:
 * locked when any class is InProgress, or any Open class has seatsTaken > 0
 * (proxy for Active enrollments).
 */
export async function fetchProgramCohortLock(
  programId: string,
): Promise<ProgramCohortLock> {
  try {
    const result = await getClasses({
      programId,
      page: 1,
      pageSize: 100,
    });
    const items = result?.data?.items ?? [];

    if (items.some((item) => item.status === "InProgress")) {
      return {
        locked: true,
        reason:
          "Không sửa/xóa chương trình khi còn lớp đang học (InProgress). Chờ lớp hoàn thành.",
      };
    }

    if (items.some((item) => item.status === "Open" && item.seatsTaken > 0)) {
      return {
        locked: true,
        reason:
          "Không sửa/xóa chương trình khi lớp đang tuyển sinh (Open) đã có học viên ghi danh.",
      };
    }

    return { locked: false, reason: null };
  } catch {
    return { locked: false, reason: null };
  }
}
