import type { EnrollmentCurriculum } from "@/lib/api/entities/enrollment-curriculum";

import { countCompletedModules } from "./module-completion";

export type RecoveryCheckoutContext = {
  programName: string | null;
  programPrice: number | null;
  completedModuleCount: number;
};

export function buildRecoveryCheckoutContext(
  curriculum: EnrollmentCurriculum,
  programPrice: number | null | undefined,
): RecoveryCheckoutContext {
  return {
    programName: curriculum.programName?.trim() || null,
    programPrice: programPrice ?? null,
    completedModuleCount: countCompletedModules(curriculum),
  };
}
