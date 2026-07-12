import { z } from "zod";

/** Path param for `GET /api/assignments/{assignmentId}` and quiz start. */
export const assignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid("ID bài tập không hợp lệ."),
});

/** Path param for submission-scoped quiz routes. */
export const submissionIdParamSchema = z.object({
  submissionId: z.string().uuid("ID bài nộp không hợp lệ."),
});

export const quizAnswerInputSchema = z.object({
  questionId: z.string().uuid("ID câu hỏi không hợp lệ."),
  selectedOptionIds: z
    .array(z.string().uuid("ID lựa chọn không hợp lệ."))
    .min(1, "Chọn ít nhất một đáp án."),
});

/** Body for `PUT /api/submissions/{submissionId}/quiz/answers`. */
export const saveQuizAnswersSchema = z.object({
  answers: z.array(quizAnswerInputSchema).min(1, "Cần ít nhất một câu trả lời."),
});

/**
 * Body for `POST /api/submissions/{submissionId}/quiz/submit`.
 * Empty array is allowed when all drafts are already saved.
 */
export const submitQuizSchema = z.object({
  answers: z.array(quizAnswerInputSchema),
});

export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;
export type QuizAnswerInput = z.infer<typeof quizAnswerInputSchema>;
export type SaveQuizAnswersInput = z.infer<typeof saveQuizAnswersSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
