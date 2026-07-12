import { z } from "zod";

export const retrospectiveSubmissionStatusSchema = z.enum([
  "Pending",
  "TurnedIn",
  "Graded",
  "ReturnedForRevision",
]);

export const retrospectiveAttemptSchema = z.object({
  submissionId: z.string(),
  assignmentId: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  attemptNumber: z.number(),
  status: retrospectiveSubmissionStatusSchema,
  contentText: z.string().nullable(),
  lastSavedAt: z.string().nullable(),
  assignedGrade: z.number().nullable(),
  passScore: z.number(),
  maxPoints: z.number(),
  passed: z.boolean().nullable(),
  mentorFeedback: z.string().nullable(),
  submittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
});

export const saveRetrospectiveDraftResultSchema = z.object({
  lastSavedAt: z.string(),
});

export type RetrospectiveSubmissionStatus = z.infer<
  typeof retrospectiveSubmissionStatusSchema
>;
export type RetrospectiveAttempt = z.infer<typeof retrospectiveAttemptSchema>;
export type SaveRetrospectiveDraftResult = z.infer<
  typeof saveRetrospectiveDraftResultSchema
>;
