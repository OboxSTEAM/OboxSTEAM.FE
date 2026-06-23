import { z } from "zod";

import {
  activityMaterialSchema,
  curriculumMaterialSummarySchema,
} from "@/lib/api/entities/material";
import { activityLearningProgressSchema } from "@/lib/api/entities/activity-progress";

export const activityTypeSchema = z.enum(["SelfPaced", "LiveOnline", "Offline"]);

/** Activity node in the program curriculum tree. */
export const curriculumActivitySchema = z.object({
  activityId: z.string(),
  activityName: z.string(),
  activityOrder: z.number(),
  activityType: activityTypeSchema,
  material: curriculumMaterialSummarySchema.nullable(),
});

export const activitySchema = z.object({
  id: z.string(),
  code: z.string(),
  courseId: z.string(),
  name: z.string(),
  activityType: activityTypeSchema,
  description: z.string(),
  activityOrder: z.number(),
  location: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  maxCapacity: z.number().nullable(),
  requireQrCheckin: z.boolean(),
  requireMediaEvidence: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  material: activityMaterialSchema.nullable(),
  learningProgress: activityLearningProgressSchema.nullable(),
});

export type ActivityType = z.infer<typeof activityTypeSchema>;
export type CurriculumActivity = z.infer<typeof curriculumActivitySchema>;
export type Activity = z.infer<typeof activitySchema>;

export type { ActivityLearningProgress } from "@/lib/api/entities/activity-progress";
