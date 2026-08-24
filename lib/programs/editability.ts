import { getClasses } from "@/lib/api/classes";
import { CLASS_STATUS_LABELS } from "@/lib/classes/constants";

export type ProgramCohortLockClass = {
  id: string;
  code: string;
  name: string;
  status: "InProgress" | "Open";
};

export type ProgramCohortLock = {
  locked: boolean;
  reason: string | null;
  blockingClasses: ProgramCohortLockClass[];
};

function formatClassLabel(item: ProgramCohortLockClass): string {
  const code = item.code.trim();
  const name = item.name.trim();
  if (code && name) return `${code} — ${name}`;
  return name || code || "Lớp không tên";
}

function toLockClass(
  item: { id: string; code: string; name: string; status: string },
  status: "InProgress" | "Open",
): ProgramCohortLockClass {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    status,
  };
}

function buildReason(
  kind: "InProgress" | "Open",
  classes: ProgramCohortLockClass[],
): string {
  const count = classes.length;
  const labels = classes.map(formatClassLabel).join("; ");
  const statusLabel = CLASS_STATUS_LABELS[kind].toLowerCase();

  if (kind === "InProgress") {
    return `Có ${count} lớp đang học (${statusLabel}): ${labels}. Chờ lớp hoàn thành rồi mới sửa/xóa.`;
  }

  return `Có ${count} lớp đang tuyển sinh (${statusLabel}) đã có học viên ghi danh: ${labels}.`;
}

/**
 * Mirrors BE CurriculumEditGuard / program PUT-DELETE 409 rules:
 * locked when any class is InProgress, or any Open class has seatsTaken > 0
 * (proxy for Active enrollments).
 */
export async function fetchProgramCohortLock(
  programId: string,
): Promise<ProgramCohortLock> {
  const unlocked: ProgramCohortLock = {
    locked: false,
    reason: null,
    blockingClasses: [],
  };

  try {
    const inProgressResult = await getClasses({
      programId,
      status: "InProgress",
      page: 1,
      pageSize: 100,
    });
    const inProgressItems = inProgressResult?.data?.items ?? [];

    if (inProgressItems.length > 0) {
      const blockingClasses = inProgressItems.map((item) =>
        toLockClass(item, "InProgress"),
      );
      return {
        locked: true,
        reason: buildReason("InProgress", blockingClasses),
        blockingClasses,
      };
    }

    const openResult = await getClasses(
      {
        programId,
        status: "Open",
        page: 1,
        pageSize: 100,
      },
      { includeSeatsTaken: true },
    );
    const openWithSeats = (openResult?.data?.items ?? []).filter(
      (item) => item.seatsTaken > 0,
    );

    if (openWithSeats.length > 0) {
      const blockingClasses = openWithSeats.map((item) =>
        toLockClass(item, "Open"),
      );
      return {
        locked: true,
        reason: buildReason("Open", blockingClasses),
        blockingClasses,
      };
    }

    return unlocked;
  } catch {
    return unlocked;
  }
}

export function formatCohortLockClassLabel(
  item: ProgramCohortLockClass,
): string {
  return formatClassLabel(item);
}
