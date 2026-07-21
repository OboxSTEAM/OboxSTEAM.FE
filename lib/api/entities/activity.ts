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
  code: z.string().nullable().optional(),
  courseId: z.string(),
  name: z.string(),
  activityType: activityTypeSchema,
  description: z.string().nullable().optional(),
  activityOrder: z.number(),
  location: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  maxCapacity: z.number().nullable().optional(),
  requireQrCheckin: z.preprocess((val) => val === true, z.boolean()),
  requireMediaEvidence: z.preprocess((val) => val === true, z.boolean()),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  material: activityMaterialSchema.nullable().optional(),
  learningProgress: activityLearningProgressSchema.nullable().optional(),
});

export type ActivityType = z.infer<typeof activityTypeSchema>;
export type CurriculumActivity = z.infer<typeof curriculumActivitySchema>;
export type Activity = z.infer<typeof activitySchema>;

export type { ActivityLearningProgress } from "@/lib/api/entities/activity-progress";
