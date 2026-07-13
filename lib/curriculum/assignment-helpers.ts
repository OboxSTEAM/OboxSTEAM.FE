import type {
  AssignmentType,
  EnrollmentAssignmentStatus,
  EnrollmentCurriculum,
  EnrollmentCurriculumAssignment,
} from "@/lib/api";

export type FlatCurriculumAssignment = {
  assignmentId: string;
  assignmentCode: string;
  title: string;
  assignmentType: AssignmentType;
  status: EnrollmentAssignmentStatus;
  moduleId: string;
  moduleName: string;
  courseId: string | null;
  courseName: string | null;
  milestoneId: string | null;
  milestoneName: string | null;
};

export type AssignmentBreadcrumb = {
  moduleName: string;
  groupLabel: string | null;
};

const SELECTABLE_STATUSES: EnrollmentAssignmentStatus[] = [
  "available",
  "submitted",
  "completed",
];

function mapFlatAssignment(
  assignment: EnrollmentCurriculumAssignment,
  module: EnrollmentCurriculum["modules"][number],
  courseId: string | null,
  courseName: string | null,
  milestoneId: string | null = null,
  milestoneName: string | null = null,
): FlatCurriculumAssignment {
  return {
    assignmentId: assignment.assignmentId,
    assignmentCode: assignment.assignmentCode,
    title: assignment.title,
    assignmentType: assignment.assignmentType,
    status: assignment.status,
    moduleId: module.moduleId,
    moduleName: module.moduleName,
    courseId,
    courseName,
    milestoneId,
    milestoneName,
  };
}

export function flattenCurriculumAssignments(
  curriculum: EnrollmentCurriculum,
): FlatCurriculumAssignment[] {
  const items: FlatCurriculumAssignment[] = [];

  const modules = [...curriculum.modules].sort(
    (left, right) => left.moduleOrder - right.moduleOrder,
  );

  for (const module of modules) {
    for (const assignment of module.assignments) {
      items.push(mapFlatAssignment(assignment, module, null, null));
    }

    const courses = [...module.courses].sort(
      (left, right) => left.courseOrder - right.courseOrder,
    );

    for (const course of courses) {
      for (const assignment of course.assignments) {
        items.push(
          mapFlatAssignment(assignment, module, course.courseId, course.courseName),
        );
      }
    }

    const milestones = [...module.milestones].sort(
      (left, right) => left.milestoneOrder - right.milestoneOrder,
    );

    for (const milestone of milestones) {
      if (milestone.assignment) {
        items.push(
          mapFlatAssignment(
            milestone.assignment,
            module,
            null,
            null,
            milestone.milestoneId,
            milestone.milestoneName,
          ),
        );
      }
    }
  }

  return items;
}

export function findFlatAssignment(
  curriculum: EnrollmentCurriculum,
  assignmentId: string,
): FlatCurriculumAssignment | null {
  return (
    flattenCurriculumAssignments(curriculum).find(
      (item) => item.assignmentId === assignmentId,
    ) ?? null
  );
}

export function getAssignmentBreadcrumb(
  curriculum: EnrollmentCurriculum,
  assignmentId: string,
): AssignmentBreadcrumb | null {
  const flat = findFlatAssignment(curriculum, assignmentId);
  if (!flat) return null;

  return {
    moduleName: flat.moduleName,
    groupLabel: flat.courseName ?? flat.milestoneName,
  };
}

export function isAssignmentSelectable(status: EnrollmentAssignmentStatus): boolean {
  return SELECTABLE_STATUSES.includes(status);
}
