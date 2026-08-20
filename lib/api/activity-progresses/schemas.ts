import { z } from "zod";

import { activityProgressRecordSchema } from "@/lib/api/entities/activity-progress-record";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const activityProgressRecordValueSchema = createApiValueSchema(
  activityProgressRecordSchema,
);

export const forceCompleteActivityResponseSchema = createApiResponseSchema(
  activityProgressRecordValueSchema,
);

export const mentorCompleteStudentOutcomeSchema = z.enum([
  "Completed",
  "AlreadyDone",
  "Skipped",
]);

export const mentorCompleteStudentResultSchema = z.object({
  studentId: z.string().uuid(),
  outcome: mentorCompleteStudentOutcomeSchema,
  reason: z.string().nullish().transform((value) => value ?? null),
  progress: activityProgressRecordSchema.nullish().optional(),
});

export const mentorCompleteBulkDataSchema = z.object({
  classSessionId: z.string().uuid(),
  activityId: z.string().uuid(),
  results: z
    .array(mentorCompleteStudentResultSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const mentorCompleteBulkResponseSchema = createApiResponseSchema(
  createApiValueSchema(mentorCompleteBulkDataSchema),
);

export type ForceCompleteActivityResponse = z.infer<
  typeof forceCompleteActivityResponseSchema
>;
export type ForceCompleteActivityResult = ForceCompleteActivityResponse["value"];

export type MentorCompleteStudentOutcome = z.infer<
  typeof mentorCompleteStudentOutcomeSchema
>;
export type MentorCompleteStudentResult = z.infer<
  typeof mentorCompleteStudentResultSchema
>;
export type MentorCompleteBulkData = z.infer<typeof mentorCompleteBulkDataSchema>;
export type MentorCompleteBulkResponse = z.infer<
  typeof mentorCompleteBulkResponseSchema
>;
export type MentorCompleteBulkResult = MentorCompleteBulkResponse["value"];
