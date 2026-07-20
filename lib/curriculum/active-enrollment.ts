import {
  getMyProgramEnrollments,
  type ProgramEnrollment,
} from "@/lib/api";

export const ENROLLMENT_GATE_STATUSES = new Set<ProgramEnrollment["status"]>([
  "Active",
  "Completed",
]);

/**
 * Resolves the current student's Active/Completed enrollment for a program.
 * Returns `null` when no gated enrollment exists (caller should redirect).
 */
export async function resolveActiveProgramEnrollment(
  programId: string,
): Promise<ProgramEnrollment | null> {
  const enrollmentsResult = await getMyProgramEnrollments({
    page: 1,
    pageSize: 50,
  });

  if (!enrollmentsResult?.data) {
    throw new Error("Program enrollments response missing data.");
  }

  return (
    enrollmentsResult.data.items.find(
      (item) =>
        item.programId === programId && ENROLLMENT_GATE_STATUSES.has(item.status),
    ) ?? null
  );
}
