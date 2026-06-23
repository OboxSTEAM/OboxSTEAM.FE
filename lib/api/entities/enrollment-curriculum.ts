import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { activityNavStatusSchema, resumeStateSchema } from "@/lib/api/entities/activity-progress";
import { curriculumMaterialSummarySchema } from "@/lib/api/entities/material";
import { moduleTypeSchema } from "@/lib/api/entities/module";

export const enrollmentCurriculumActivitySchema = z.object({
  activityId: z.string(),
  activityName: z.string(),
  activityOrder: z.number(),
  activityType: activityTypeSchema,
  status: activityNavStatusSchema,
  resumeState: resumeStateSchema.nullable(),
  lastAccessedAt: z.string().nullable(),
  material: curriculumMaterialSummarySchema.nullable(),
});

export const enrollmentCurriculumCourseSchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  courseOrder: z.number(),
  activities: z.array(enrollmentCurriculumActivitySchema),
});

export const enrollmentCurriculumMilestoneSchema = z.object({
  milestoneId: z.string(),
  milestoneName: z.string(),
  milestoneOrder: z.number(),
  activities: z.array(enrollmentCurriculumActivitySchema),
});

export const enrollmentCurriculumModuleSchema = z.object({
  moduleId: z.string(),
  moduleName: z.string(),
  moduleOrder: z.number(),
  moduleType: moduleTypeSchema,
  prerequisiteModuleId: z.string().nullable(),
  isLocked: z.boolean(),
  lockReason: z.string().nullable(),
  moduleEnrollmentId: z.string(),
  courses: z.array(enrollmentCurriculumCourseSchema),
  milestones: z.array(enrollmentCurriculumMilestoneSchema).default([]),
});

export const enrollmentCurriculumSchema = z.object({
  enrollmentId: z.string(),
  programId: z.string(),
  programName: z.string(),
  progressPercent: z.number(),
  currentActivityId: z.string().nullable(),
  modules: z.array(enrollmentCurriculumModuleSchema),
});

export type EnrollmentCurriculumActivity = z.infer<typeof enrollmentCurriculumActivitySchema>;
export type EnrollmentCurriculumCourse = z.infer<typeof enrollmentCurriculumCourseSchema>;
export type EnrollmentCurriculumMilestone = z.infer<typeof enrollmentCurriculumMilestoneSchema>;
export type EnrollmentCurriculumModule = z.infer<typeof enrollmentCurriculumModuleSchema>;
export type EnrollmentCurriculum = z.infer<typeof enrollmentCurriculumSchema>;
