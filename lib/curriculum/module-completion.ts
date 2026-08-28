import type {
  EnrollmentCurriculum,
  EnrollmentCurriculumModule,
} from "@/lib/api/entities/enrollment-curriculum";

function getRequiredModuleAssignments(
  module: EnrollmentCurriculumModule,
): EnrollmentCurriculumModule["assignments"] {
  return [
    ...module.assignments,
    ...module.courses.flatMap((course) => course.assignments),
    ...module.milestones
      .map((milestone) => milestone.assignment)
      .filter((assignment): assignment is NonNullable<typeof assignment> =>
        Boolean(assignment),
      ),
  ].filter((assignment) => assignment.isRequiredForModulePass);
}

export function isModuleLikelyCompleted(
  module: EnrollmentCurriculumModule,
): boolean {
  const required = getRequiredModuleAssignments(module);
  if (required.length === 0) return false;
  return required.every((assignment) => assignment.status === "completed");
}

export function countCompletedModules(
  curriculum: EnrollmentCurriculum,
): number {
  return curriculum.modules.filter(isModuleLikelyCompleted).length;
}
