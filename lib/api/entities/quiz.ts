import { z } from "zod";

import { assignmentSubmissionStatusSchema } from "@/lib/api/entities/assignment-submission";

export const questionTypeSchema = z.enum(["SingleChoice", "MultipleChoice"]);

/** Alias of assignment submission status (quiz graded results use the same enum). */
export const submissionStatusSchema = assignmentSubmissionStatusSchema;

export const quizQuestionOptionSchema = z.object({
  id: z.string(),
  optionText: z.string(),
});

export const quizQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  questionType: questionTypeSchema,
  points: z.number(),
  orderIndex: z.number(),
  options: z.array(quizQuestionOptionSchema),
});

export const quizSavedAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptionIds: z.array(z.string()).nullish().transform((v) => v ?? []),
});

export const quizAttemptSchema = z.object({
  submissionId: z.string(),
  assignmentId: z.string(),
  studentId: z.string().nullish().transform((v) => v ?? ""),
  studentName: z.string().nullish().transform((v) => v ?? null),
  attemptNumber: z.number(),
  timeLimitMinutes: z.number().nullish().transform((v) => v ?? 0),
  startedAt: z.string().nullish().transform((v) => v ?? ""),
  expiresAt: z.string().nullish().transform((v) => v ?? ""),
  questions: z
    .array(quizQuestionSchema)
    .nullish()
    .transform((v) => v ?? []),
  savedAnswers: z
    .array(quizSavedAnswerSchema)
    .nullish()
    .transform((v) => v ?? []),
});

export const saveQuizDraftResultSchema = z.object({
  lastSavedAt: z.string(),
  savedCount: z.number(),
});

export const quizResultSchema = z.object({
  submissionId: z.string(),
  assignmentId: z.string(),
  studentId: z.string().nullish().transform((v) => v ?? ""),
  studentName: z.string().nullish().transform((v) => v ?? null),
  attemptNumber: z.number(),
  startedAt: z.string().nullish().transform((v) => v ?? null),
  assignedGrade: z.number(),
  maxPoints: z.number(),
  passScore: z.number(),
  passed: z.boolean(),
  correctCount: z.number(),
  totalQuestions: z.number(),
  status: assignmentSubmissionStatusSchema,
  submittedAt: z.string().nullish().transform((v) => v ?? null),
});

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type QuizQuestionOption = z.infer<typeof quizQuestionOptionSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizSavedAnswer = z.infer<typeof quizSavedAnswerSchema>;
export type QuizAttempt = z.infer<typeof quizAttemptSchema>;
export type SaveQuizDraftResult = z.infer<typeof saveQuizDraftResultSchema>;
export type QuizResult = z.infer<typeof quizResultSchema>;
