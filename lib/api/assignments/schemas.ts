import { z } from "zod";

import { assignmentDetailSchema } from "@/lib/api/entities/assignment";
import {
  quizAttemptSchema,
  quizResultSchema,
  saveQuizDraftResultSchema,
} from "@/lib/api/entities/quiz";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const assignmentDetailValueSchema = createApiValueSchema(assignmentDetailSchema);

export const quizAttemptValueSchema = createApiValueSchema(quizAttemptSchema);

export const saveQuizDraftResultValueSchema = createApiValueSchema(saveQuizDraftResultSchema);

export const quizResultValueSchema = createApiValueSchema(quizResultSchema);

export const getAssignmentByIdResponseSchema = createApiResponseSchema(
  assignmentDetailValueSchema,
);

export const startQuizAttemptResponseSchema = createApiResponseSchema(quizAttemptValueSchema);

export const getInProgressQuizResponseSchema = createApiResponseSchema(quizAttemptValueSchema);

export const saveQuizDraftAnswersResponseSchema = createApiResponseSchema(
  saveQuizDraftResultValueSchema,
);

export const submitQuizResponseSchema = createApiResponseSchema(quizResultValueSchema);

export const getQuizResultResponseSchema = createApiResponseSchema(quizResultValueSchema);

export type GetAssignmentByIdResponse = z.infer<typeof getAssignmentByIdResponseSchema>;
export type GetAssignmentByIdResult = GetAssignmentByIdResponse["value"];

export type StartQuizAttemptResponse = z.infer<typeof startQuizAttemptResponseSchema>;
export type StartQuizAttemptResult = StartQuizAttemptResponse["value"];

export type GetInProgressQuizResponse = z.infer<typeof getInProgressQuizResponseSchema>;
export type GetInProgressQuizResult = GetInProgressQuizResponse["value"];

export type SaveQuizDraftAnswersResponse = z.infer<
  typeof saveQuizDraftAnswersResponseSchema
>;
export type SaveQuizDraftAnswersResult = SaveQuizDraftAnswersResponse["value"];

export type SubmitQuizResponse = z.infer<typeof submitQuizResponseSchema>;
export type SubmitQuizResult = SubmitQuizResponse["value"];

export type GetQuizResultResponse = z.infer<typeof getQuizResultResponseSchema>;
export type GetQuizResultResult = GetQuizResultResponse["value"];
