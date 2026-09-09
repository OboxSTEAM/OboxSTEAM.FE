import { z } from "zod";

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? "");

export const curriculumReviewDecisionSchema = z.enum([
  "Approved",
  "ChangesRequested",
]);

export const reviewCriterionScoreSchema = z.object({
  id: z.string().uuid(),
  criterionId: z.string().uuid(),
  criterionName: nullableStringSchema,
  score: z.number().int(),
  maxScore: z.number().int(),
  comment: nullableStringSchema,
});

export type ReviewCriterionScore = z.infer<typeof reviewCriterionScoreSchema>;

export const curriculumReviewSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  expertId: z.string().uuid(),
  expertName: nullableStringSchema,
  round: z.number().int(),
  submissionId: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  snapshotAvailable: z.boolean().nullish().transform((value) => value ?? false),
  decision: curriculumReviewDecisionSchema,
  comment: nullableStringSchema,
  reviewedAt: z.string(),
  scores: z
    .array(reviewCriterionScoreSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type CurriculumReview = z.infer<typeof curriculumReviewSchema>;
export type CurriculumReviewDecision = z.infer<
  typeof curriculumReviewDecisionSchema
>;
