import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { activityNavStatusSchema, resumeStateSchema } from "@/lib/api/entities/activity-progress";
import { enrollmentCurriculumAssignmentSchema } from "@/lib/api/entities/assignment";
import { curriculumMaterialSummarySchema } from "@/lib/api/entities/material";
import { moduleTypeSchema } from "@/lib/api/entities/module";

export const enrollmentCurriculumActivitySchema = z.object({
  activityId: z.string(),
  activityName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  activityOrder: z.number(),
  activityType: activityTypeSchema,
  status: activityNavStatusSchema
    .nullish()
    .transform((value) => value ?? "locked"),
  resumeState: resumeStateSchema.nullable(),
  lastAccessedAt: z.string().nullable(),
  material: curriculumMaterialSummarySchema.nullable(),
});

export const enrollmentCurriculumCourseSchema = z.object({
  courseId: z.string(),
  courseName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  courseOrder: z.number(),
  activities: z
    .array(enrollmentCurriculumActivitySchema)
    .nullish()
    .transform((value) => value ?? []),
  assignments: z
    .array(enrollmentCurriculumAssignmentSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const enrollmentCurriculumMilestoneSchema = z.object({
  milestoneId: z.string(),
  milestoneName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  milestoneOrder: z.number(),
  activities: z
    .array(enrollmentCurriculumActivitySchema)
    .nullish()
    .transform((value) => value ?? []),
  assignment: enrollmentCurriculumAssignmentSchema.nullable(),
});

export const enrollmentCurriculumModuleSchema = z.object({
  moduleId: z.string(),
  moduleName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  moduleOrder: z.number(),
  moduleType: moduleTypeSchema,
  prerequisiteModuleId: z.string().nullable(),
  isLocked: z.boolean(),
  lockReason: z.string().nullable(),
  moduleEnrollmentId: z.string().nullable(),
  courses: z
    .array(enrollmentCurriculumCourseSchema)
    .nullish()
    .transform((value) => value ?? []),
  milestones: z
    .array(enrollmentCurriculumMilestoneSchema)
    .nullish()
    .transform((value) => value ?? []),
  assignments: z
    .array(enrollmentCurriculumAssignmentSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const enrollmentCurriculumSchema = z.object({
  enrollmentId: z.string(),
  programId: z.string(),
  programName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  progressPercent: z.number(),
  currentActivityId: z.string().nullable(),
  modules: z
    .array(enrollmentCurriculumModuleSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type EnrollmentCurriculumActivity = z.infer<typeof enrollmentCurriculumActivitySchema>;
export type EnrollmentCurriculumCourse = z.infer<typeof enrollmentCurriculumCourseSchema>;
export type EnrollmentCurriculumMilestone = z.infer<typeof enrollmentCurriculumMilestoneSchema>;
export type EnrollmentCurriculumModule = z.infer<typeof enrollmentCurriculumModuleSchema>;
export type EnrollmentCurriculum = z.infer<typeof enrollmentCurriculumSchema>;

export type { EnrollmentCurriculumAssignment } from "@/lib/api/entities/assignment";
