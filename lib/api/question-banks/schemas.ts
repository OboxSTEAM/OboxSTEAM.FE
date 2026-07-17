import { z } from "zod";

import { questionBankSchema } from "@/lib/api/entities/question-bank";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const questionBankValueSchema = createApiValueSchema(questionBankSchema);

export const getQuestionBankResponseSchema = createApiResponseSchema(questionBankValueSchema);
export const createQuestionBankResponseSchema = createApiResponseSchema(questionBankValueSchema);
export const deleteQuestionBankResponseSchema = createApiResponseSchema(z.unknown());
export const importQuestionsResponseSchema = createApiResponseSchema(z.unknown());

export type GetQuestionBankResponse = z.infer<typeof getQuestionBankResponseSchema>;
export type GetQuestionBankResult = GetQuestionBankResponse["value"];

export type CreateQuestionBankResponse = z.infer<typeof createQuestionBankResponseSchema>;
export type CreateQuestionBankResult = CreateQuestionBankResponse["value"];

export type ImportQuestionsResponse = z.infer<typeof importQuestionsResponseSchema>;
export type ImportQuestionsResult = ImportQuestionsResponse["value"];
