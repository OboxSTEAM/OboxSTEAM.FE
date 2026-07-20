import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { researchSubmissionStatusSchema } from "@/lib/api/entities/research-submission";

export const studentMilestoneActivityProgressSchema = z.object({
  activityId: z.string(),
  title: z.string().nullable(),
  activityType: activityTypeSchema,
  isRequiredForSubmission: z.boolean(),
  isSatisfied: z.boolean(),
});

export const studentMilestoneItemProgressSchema = z.object({
  milestoneId: z.string(),
  code: z.string().nullable(),
  title: z.string().nullable(),
  milestoneOrder: z.number(),
  isCapstone: z.boolean(),
  isUnlocked: z.boolean(),
  unlockReason: z.string().nullable(),
  canSubmit: z.boolean(),
  submitBlockReasons: z.array(z.string()).nullable(),
  assignmentId: z.string(),
  submissionId: z.string().nullable(),
  submissionStatus: researchSubmissionStatusSchema.nullable(),
  assignedGrade: z.number().nullable(),
  passed: z.boolean().nullable(),
  requiredActivities: z.array(studentMilestoneActivityProgressSchema).nullable(),
});

export const studentMilestoneProgressSchema = z.object({
  moduleEnrollmentId: z.string(),
  moduleId: z.string(),
  milestones: z.array(studentMilestoneItemProgressSchema).nullable(),
});

export type StudentMilestoneActivityProgress = z.infer<
  typeof studentMilestoneActivityProgressSchema
>;
export type StudentMilestoneItemProgress = z.infer<typeof studentMilestoneItemProgressSchema>;
export type StudentMilestoneProgress = z.infer<typeof studentMilestoneProgressSchema>;
