import { z } from "zod";

import { classSessionStatusSchema } from "@/lib/api/entities/class-session";

/** Class-scoped activity nav status (mentor curriculum tree). */
export const classCurriculumActivityNavStatusSchema = z.enum([
  "completed",
  "current",
  "available",
]);

/**
 * Class-scoped assignment nav status (mentor curriculum tree).
 * Mirrors student assignment icons: available · submitted · completed.
 */
export const classCurriculumAssignmentNavStatusSchema = z.enum([
  "available",
  "submitted",
  "completed",
]);

const ACTIVITY_NAV_STATUSES = new Set<string>([
  "completed",
  "current",
  "available",
]);

const ASSIGNMENT_NAV_STATUSES = new Set<string>([
  "available",
  "submitted",
  "completed",
]);

/** OpenAPI types status as free string — coerce unknown/null to a safe default. */
function coerceActivityNavStatus(value: unknown) {
  if (typeof value === "string" && ACTIVITY_NAV_STATUSES.has(value)) {
    return value as z.infer<typeof classCurriculumActivityNavStatusSchema>;
  }
  return "available" as const;
}

function coerceAssignmentNavStatus(value: unknown) {
  if (typeof value === "string" && ASSIGNMENT_NAV_STATUSES.has(value)) {
    return value as z.infer<typeof classCurriculumAssignmentNavStatusSchema>;
  }
  return "available" as const;
}

/** Matches `ClassCurriculumActivityProgressDto`. */
export const classCurriculumActivityProgressSchema = z.object({
  activityId: z.string().uuid(),
  status: z.preprocess(coerceActivityNavStatus, classCurriculumActivityNavStatusSchema),
  classSessionId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  sessionStatus: classSessionStatusSchema
    .nullish()
    .transform((value) => value ?? null),
  completedCount: z.number().int(),
  inProgressCount: z.number().int(),
});

/** Matches `ClassCurriculumAssignmentProgressDto`. */
export const classCurriculumAssignmentProgressSchema = z.object({
  assignmentId: z.string().uuid(),
  status: z.preprocess(
    coerceAssignmentNavStatus,
    classCurriculumAssignmentNavStatusSchema,
  ),
  submittedCount: z.number().int(),
  gradedCount: z.number().int(),
  averageScore: z
    .number()
    .nullish()
    .transform((value) => value ?? null),
});

/** Matches `ClassCurriculumModuleProgressDto`. */
export const classCurriculumModuleProgressSchema = z.object({
  moduleId: z.string().uuid(),
  activities: z.preprocess(
    (val) => val ?? [],
    z.array(classCurriculumActivityProgressSchema),
  ),
  assignments: z.preprocess(
    (val) => val ?? [],
    z.array(classCurriculumAssignmentProgressSchema),
  ),
});

/** Matches `ClassCurriculumProgressDto` — `GET /api/classes/{classId}/curriculum-progress`. */
export const classCurriculumProgressSchema = z.object({
  classId: z.string().uuid(),
  totalStudents: z.number().int(),
  currentActivityId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  modules: z.preprocess(
    (val) => val ?? [],
    z.array(classCurriculumModuleProgressSchema),
  ),
});

export type ClassCurriculumActivityNavStatus = z.infer<
  typeof classCurriculumActivityNavStatusSchema
>;
export type ClassCurriculumAssignmentNavStatus = z.infer<
  typeof classCurriculumAssignmentNavStatusSchema
>;
export type ClassCurriculumActivityProgress = z.infer<
  typeof classCurriculumActivityProgressSchema
>;
export type ClassCurriculumAssignmentProgress = z.infer<
  typeof classCurriculumAssignmentProgressSchema
>;
export type ClassCurriculumModuleProgress = z.infer<
  typeof classCurriculumModuleProgressSchema
>;
export type ClassCurriculumProgress = z.infer<
  typeof classCurriculumProgressSchema
>;
