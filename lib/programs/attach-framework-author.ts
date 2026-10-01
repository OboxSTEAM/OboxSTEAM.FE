import { addExpertToProgram, assignProgramAdvisor, type ProgramStatus } from "@/lib/api";

/** Shown on the program expert card when the framework author is attached. */
const FRAMEWORK_AUTHOR_ROLE = "Tác giả khung";

type AttachFrameworkAuthorOptions = {
  status: ProgramStatus | null | undefined;
  assignedExpertIds?: readonly string[];
  advisorExpertId?: string | null;
};

/**
 * Puts the framework owner on the program board and, while the program is a
 * Draft, makes them the advisor. `PUT /advisor` revokes an Approved program's
 * approval and is rejected once the program is published, so it is skipped then.
 */
export async function attachFrameworkAuthorToProgram(
  programId: string,
  expertId: string | null | undefined,
  { status, assignedExpertIds = [], advisorExpertId = null }: AttachFrameworkAuthorOptions,
): Promise<void> {
  const id = expertId?.trim();
  if (!id) return;

  if (!assignedExpertIds.includes(id)) {
    await addExpertToProgram(id, programId, {
      roleInBoard: FRAMEWORK_AUTHOR_ROLE,
    });
  }

  if (status === "Draft" && advisorExpertId !== id) {
    await assignProgramAdvisor(programId, { advisorExpertId: id });
  }
}

/** `true` when `attachFrameworkAuthorToProgram` would change anything. */
export function needsFrameworkAuthorAttach(
  expertId: string | null | undefined,
  { status, assignedExpertIds = [], advisorExpertId = null }: AttachFrameworkAuthorOptions,
): boolean {
  const id = expertId?.trim();
  if (!id) return false;
  return !assignedExpertIds.includes(id) || (status === "Draft" && advisorExpertId !== id);
}
