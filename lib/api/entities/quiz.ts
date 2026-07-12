import { z } from "zod";

export const questionTypeSchema = z.enum(["SingleChoice", "MultipleChoice"]);

export const submissionStatusSchema = z.enum(["Pending", "Graded"]);

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
  selectedOptionIds: z.array(z.string()),
});

export const quizAttemptSchema = z.object({
  submissionId: z.string(),
  assignmentId: z.string(),
  attemptNumber: z.number(),
  timeLimitMinutes: z.number(),
  startedAt: z.string(),
  expiresAt: z.string(),
  questions: z.array(quizQuestionSchema),
  savedAnswers: z.array(quizSavedAnswerSchema),
});

export const saveQuizDraftResultSchema = z.object({
  lastSavedAt: z.string(),
  savedCount: z.number(),
});

export const quizResultSchema = z.object({
  submissionId: z.string(),
  assignmentId: z.string(),
  attemptNumber: z.number(),
  startedAt: z.string(),
  assignedGrade: z.number(),
  maxPoints: z.number(),
  passScore: z.number(),
  passed: z.boolean(),
  correctCount: z.number(),
  totalQuestions: z.number(),
  status: submissionStatusSchema,
  submittedAt: z.string(),
});

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type QuizQuestionOption = z.infer<typeof quizQuestionOptionSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizSavedAnswer = z.infer<typeof quizSavedAnswerSchema>;
export type QuizAttempt = z.infer<typeof quizAttemptSchema>;
export type SaveQuizDraftResult = z.infer<typeof saveQuizDraftResultSchema>;
export type QuizResult = z.infer<typeof quizResultSchema>;
