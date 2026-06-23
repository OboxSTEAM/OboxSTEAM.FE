import type {
  ActivityNavStatus,
  ActivityType,
  EnrollmentCurriculum,
  EnrollmentCurriculumActivity,
  ResumeState,
} from "@/lib/api";
import type { CurriculumMaterialSummary } from "@/lib/api/entities/material";

export type FlatCurriculumActivity = {
  activityId: string;
  activityName: string;
  activityOrder: number;
  activityType: ActivityType;
  status: ActivityNavStatus;
  resumeState: ResumeState | null;
  material: CurriculumMaterialSummary | null;
  moduleId: string;
  moduleName: string;
  moduleOrder: number;
  courseId: string | null;
  courseName: string | null;
  milestoneId: string | null;
  milestoneName: string | null;
};

export type ActivityBreadcrumb = {
  moduleName: string;
  groupLabel: string | null;
};

const SELECTABLE_STATUSES: ActivityNavStatus[] = ["current", "available", "completed"];

export function flattenCurriculumActivities(
  curriculum: EnrollmentCurriculum,
): FlatCurriculumActivity[] {
  const items: FlatCurriculumActivity[] = [];

  const modules = [...curriculum.modules].sort(
    (left, right) => left.moduleOrder - right.moduleOrder,
  );

  for (const module of modules) {
    const courses = [...module.courses].sort(
      (left, right) => left.courseOrder - right.courseOrder,
    );

    for (const course of courses) {
      const activities = [...course.activities].sort(
        (left, right) => left.activityOrder - right.activityOrder,
      );

      for (const activity of activities) {
        items.push(mapFlatActivity(activity, module, course.courseId, course.courseName));
      }
    }

    const milestones = [...module.milestones].sort(
      (left, right) => left.milestoneOrder - right.milestoneOrder,
    );

    for (const milestone of milestones) {
      const activities = [...milestone.activities].sort(
        (left, right) => left.activityOrder - right.activityOrder,
      );

      for (const activity of activities) {
        items.push(
          mapFlatActivity(activity, module, null, null, milestone.milestoneId, milestone.milestoneName),
        );
      }
    }
  }

  return items;
}

function mapFlatActivity(
  activity: EnrollmentCurriculumActivity,
  module: EnrollmentCurriculum["modules"][number],
  courseId: string | null,
  courseName: string | null,
  milestoneId: string | null = null,
  milestoneName: string | null = null,
): FlatCurriculumActivity {
  return {
    activityId: activity.activityId,
    activityName: activity.activityName,
    activityOrder: activity.activityOrder,
    activityType: activity.activityType,
    status: activity.status,
    resumeState: activity.resumeState,
    material: activity.material,
    moduleId: module.moduleId,
    moduleName: module.moduleName,
    moduleOrder: module.moduleOrder,
    courseId,
    courseName,
    milestoneId,
    milestoneName,
  };
}

export function resolveInitialActivityId(curriculum: EnrollmentCurriculum): string | null {
  if (curriculum.currentActivityId) {
    return curriculum.currentActivityId;
  }

  const flat = flattenCurriculumActivities(curriculum);
  const current = flat.find((item) => item.status === "current");
  if (current) return current.activityId;

  const available = flat.find((item) => item.status === "available");
  if (available) return available.activityId;

  const completed = [...flat].reverse().find((item) => item.status === "completed");
  return completed?.activityId ?? flat[0]?.activityId ?? null;
}

export function findFlatActivity(
  curriculum: EnrollmentCurriculum,
  activityId: string,
): FlatCurriculumActivity | null {
  return (
    flattenCurriculumActivities(curriculum).find((item) => item.activityId === activityId) ??
    null
  );
}

export function getActivityBreadcrumb(
  curriculum: EnrollmentCurriculum,
  activityId: string,
): ActivityBreadcrumb | null {
  const flat = findFlatActivity(curriculum, activityId);
  if (!flat) return null;

  return {
    moduleName: flat.moduleName,
    groupLabel: flat.courseName ?? flat.milestoneName,
  };
}

export function getAdjacentActivityIds(
  curriculum: EnrollmentCurriculum,
  activityId: string,
): { previousId: string | null; nextId: string | null } {
  const flat = flattenCurriculumActivities(curriculum);
  const index = flat.findIndex((item) => item.activityId === activityId);

  if (index < 0) {
    return { previousId: null, nextId: null };
  }

  return {
    previousId: index > 0 ? flat[index - 1]?.activityId ?? null : null,
    nextId: index < flat.length - 1 ? flat[index + 1]?.activityId ?? null : null,
  };
}

export function isActivitySelectable(status: ActivityNavStatus): boolean {
  return SELECTABLE_STATUSES.includes(status);
}

export function countCompletedActivities(curriculum: EnrollmentCurriculum): {
  completed: number;
  total: number;
} {
  const flat = flattenCurriculumActivities(curriculum);
  return {
    completed: flat.filter((item) => item.status === "completed").length,
    total: flat.length,
  };
}
