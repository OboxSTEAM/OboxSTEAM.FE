import { z } from "zod";

export const programReviewSchema = z.object({
  id: z.string(),
  programId: z.string(),
  studentId: z.string(),
  studentName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  studentAvatarUrl: z.string().nullable(),
  starRating: z.number(),
  comment: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  createdAt: z.string(),
  updatedAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
});

export const programReviewEligibilityReasonSchema = z.enum([
  "NotEnrolled",
  "NotCompleted",
  "AlreadyReviewed",
  "RemovedByModerator",
]);

/** `GET /api/programs/{programId}/reviews/me` — student's review state. */
export const myProgramReviewSchema = z.object({
  canReview: z.boolean(),
  reason: programReviewEligibilityReasonSchema
    .nullish()
    .transform((value) => value ?? null),
  review: programReviewSchema.nullish().transform((value) => value ?? null),
});

export type ProgramReview = z.infer<typeof programReviewSchema>;
export type ProgramReviewEligibilityReason = z.infer<
  typeof programReviewEligibilityReasonSchema
>;
export type MyProgramReview = z.infer<typeof myProgramReviewSchema>;
