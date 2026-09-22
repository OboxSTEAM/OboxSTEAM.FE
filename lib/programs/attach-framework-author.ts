import { addExpertToProgram } from "@/lib/api";

/** Shown on the program expert card when the framework author is attached. */
const FRAMEWORK_AUTHOR_ROLE = "Tác giả khung";

/**
 * Adds the expert who owns the chosen framework to the program board.
 * Skips when that expert is already assigned.
 */
export async function attachFrameworkAuthorToProgram(
  programId: string,
  expertId: string | null | undefined,
  assignedExpertIds: readonly string[] = [],
): Promise<void> {
  const id = expertId?.trim();
  if (!id || assignedExpertIds.includes(id)) return;

  await addExpertToProgram(id, programId, {
    roleInBoard: FRAMEWORK_AUTHOR_ROLE,
  });
}
