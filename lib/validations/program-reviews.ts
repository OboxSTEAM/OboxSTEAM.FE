import { z } from "zod";

export const PROGRAM_REVIEW_COMMENT_MAX = 2000;

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;

const reviewCommentSchema = z
  .string()
  .trim()
  .max(
    PROGRAM_REVIEW_COMMENT_MAX,
    `Nhận xét không được quá ${PROGRAM_REVIEW_COMMENT_MAX} ký tự.`,
  )
  .refine((value) => !HTML_TAG_PATTERN.test(value), {
    message: "Nhận xét chỉ được chứa văn bản thuần, không chứa thẻ HTML.",
  });

/** Form values for the student review form (create + edit). */
export const programReviewFormSchema = z.object({
  starRating: z
    .number({ message: "Vui lòng chọn số sao." })
    .int()
    .min(1, "Vui lòng chọn số sao.")
    .max(5, "Tối đa 5 sao."),
  comment: reviewCommentSchema,
});

/** Body for `POST /api/programs/{programId}/reviews`. Empty comment is sent as null. */
export const createProgramReviewSchema = programReviewFormSchema.transform(
  ({ starRating, comment }) => ({
    starRating,
    comment: comment.length > 0 ? comment : null,
  }),
);

/**
 * Body for `PUT /api/programs/{programId}/reviews/{reviewId}`.
 * BE: `comment: null` keeps the old comment; `""` clears it.
 */
export const updateProgramReviewSchema = z.object({
  starRating: z.number().int().min(1).max(5).optional(),
  comment: reviewCommentSchema.optional(),
});

export type ProgramReviewFormValues = z.infer<typeof programReviewFormSchema>;
export type CreateProgramReviewInput = z.input<typeof createProgramReviewSchema>;
export type UpdateProgramReviewInput = z.infer<typeof updateProgramReviewSchema>;
