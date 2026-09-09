import { z } from "zod";

/** Query for `GET /api/programs/review-queue`. */
export const programReviewQueueQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export const reviewCriterionScoreRequestSchema = z.object({
  criterionId: z.string().uuid("ID tiêu chí không hợp lệ."),
  score: z
    .number()
    .int("Điểm phải là số nguyên.")
    .min(0, "Điểm không được âm."),
  comment: z.string().trim().max(2000).optional().nullable(),
});

export const approveCurriculumReviewSchema = z.object({
  comment: z.string().trim().max(4000).optional().nullable(),
  scores: z.array(reviewCriterionScoreRequestSchema).optional().nullable(),
});

export const requestCurriculumChangesSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập lý do cần chỉnh sửa.")
    .max(4000, "Nhận xét không được quá 4000 ký tự."),
});

export type ProgramReviewQueueQuery = z.infer<typeof programReviewQueueQuerySchema>;
export type ApproveCurriculumReviewInput = z.infer<
  typeof approveCurriculumReviewSchema
>;
export type RequestCurriculumChangesInput = z.infer<
  typeof requestCurriculumChangesSchema
>;
export type ReviewCriterionScoreRequestInput = z.infer<
  typeof reviewCriterionScoreRequestSchema
>;
