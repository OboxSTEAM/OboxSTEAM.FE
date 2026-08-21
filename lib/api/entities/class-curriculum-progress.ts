import { z } from "zod";

/** Matches `ClassCurriculumActivityProgressDto`. */
export const classCurriculumActivityProgressSchema = z.object({
  activityId: z.string().uuid(),
  completedCount: z.number().int(),
  inProgressCount: z.number().int(),
});

/** Matches `ClassCurriculumAssignmentProgressDto`. */
export const classCurriculumAssignmentProgressSchema = z.object({
  assignmentId: z.string().uuid(),
  submittedCount: z.number().int(),
  gradedCount: z.number().int(),
  averageScore: z.number().nullable(),
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
  modules: z.preprocess(
    (val) => val ?? [],
    z.array(classCurriculumModuleProgressSchema),
  ),
});

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
