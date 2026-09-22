import { addExpertToProgram, assignProgramAdvisor } from "@/lib/api";

/** Shown on the program expert card when the framework author is attached. */
const FRAMEWORK_AUTHOR_ROLE = "Tác giả khung";

/**
 * Puts the framework owner on the program board and sets them as the
 * responsible advisor. Submit-review requires `advisorExpertId`; board
 * membership alone is not enough.
 */
export async function attachFrameworkAuthorToProgram(
  programId: string,
  expertId: string | null | undefined,
  assignedExpertIds: readonly string[] = [],
  advisorExpertId: string | null = null,
): Promise<void> {
  const id = expertId?.trim();
  if (!id) return;

  if (!assignedExpertIds.includes(id)) {
    await addExpertToProgram(id, programId, {
      roleInBoard: FRAMEWORK_AUTHOR_ROLE,
    });
  }

  if (advisorExpertId !== id) {
    await assignProgramAdvisor(programId, { advisorExpertId: id });
  }
}
