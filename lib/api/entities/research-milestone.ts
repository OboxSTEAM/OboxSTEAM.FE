import { z } from "zod";

import { activityTypeSchema } from "@/lib/api/entities/activity";
import { assignmentTypeSchema } from "@/lib/api/entities/assignment";

/** Activity linked to a research milestone (`ResearchMilestoneActivityResponseDto`). */
export const researchMilestoneActivitySchema = z.object({
  id: z.string(),
  activityId: z.string(),
  activityCode: z.string().nullable().optional(),
  activityTitle: z.string().nullable().optional(),
  activityType: activityTypeSchema,
  isRequiredForSubmission: z.boolean(),
  displayOrder: z.number(),
});

/** Deliverable assignment embedded in a milestone — kept lenient against contract drift. */
export const milestoneAssignmentSchema = z
  .object({
    id: z.string(),
    code: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    assignmentType: assignmentTypeSchema.nullable().optional(),
    maxPoints: z.number().nullable().optional(),
    passScore: z.number().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    availableFrom: z.string().nullable().optional(),
    availableUntil: z.string().nullable().optional(),
    maxAttempts: z.number().nullable().optional(),
  })
  .passthrough();

/** Research milestone (`ResearchMilestoneResponseDto`). */
export const researchMilestoneSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  moduleId: z.string(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  milestoneOrder: z.number(),
  isCapstone: z.boolean(),
  assignmentId: z.string().nullable().optional(),
  assignment: milestoneAssignmentSchema.nullable().optional(),
  activities: z.array(researchMilestoneActivitySchema).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type ResearchMilestoneActivity = z.infer<typeof researchMilestoneActivitySchema>;
export type MilestoneAssignment = z.infer<typeof milestoneAssignmentSchema>;
export type ResearchMilestone = z.infer<typeof researchMilestoneSchema>;
