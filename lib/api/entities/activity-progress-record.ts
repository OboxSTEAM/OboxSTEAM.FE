import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { resumeStateSchema } from "@/lib/api/entities/activity-progress";

export const activityProgressStatusSchema = z.enum([
  "NotStart",
  "InProgress",
  "Done",
]);

/** `ActivityProgressResponseDto` from ActivityProgress endpoints. */
export const activityProgressRecordSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  activityId: z.string().uuid(),
  moduleEnrollmentId: z.string().uuid(),
  activityStatus: activityProgressStatusSchema,
  isCompleted: z.boolean(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  moduleProgressPercent: z.number().nullable().optional(),
  programProgressPercent: z.number().nullable().optional(),
  activityCode: z.string().nullable().optional(),
  activityName: z.string().nullable().optional(),
  activityType: activityTypeSchema.optional(),
  activityOrder: z.number().optional(),
  resumeState: resumeStateSchema.nullable().optional(),
  lastAccessedAt: z.string().nullable().optional(),
});

export type ActivityProgressStatus = z.infer<typeof activityProgressStatusSchema>;
export type ActivityProgressRecord = z.infer<typeof activityProgressRecordSchema>;
