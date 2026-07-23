import { z } from "zod";

import { bankQuestionSchema } from "@/lib/api/entities/bank-question";
import {
  questionBankListItemSchema,
  questionBankSchema,
} from "@/lib/api/entities/question-bank";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const questionBankValueSchema = createApiValueSchema(questionBankSchema);

export const paginatedQuestionBanksSchema = createPaginatedSchema(
  questionBankListItemSchema,
);
export const questionBanksListValueSchema = createApiValueSchema(
  paginatedQuestionBanksSchema,
);
export const getQuestionBanksResponseSchema = createApiResponseSchema(
  questionBanksListValueSchema,
);

/** One failed CSV row (`ImportRowErrorDto`). */
export const importRowErrorSchema = z
  .object({
    rowNumber: z.number().nullable().optional(),
    questionText: z.string().nullable().optional(),
    error: z.string().nullable().optional(),
  })
  .passthrough();

/** CSV import outcome (`ImportBankQuestionsResultDto`). */
export const importQuestionsResultSchema = z
  .object({
    totalRows: z.number().nullable().optional(),
    importedCount: z.number().nullable().optional(),
    failedCount: z.number().nullable().optional(),
    errors: z.array(importRowErrorSchema).nullable().optional(),
    importedQuestions: z.array(bankQuestionSchema).nullable().optional(),
  })
  .passthrough();

export const importQuestionsValueSchema = createApiValueSchema(importQuestionsResultSchema);

export const getQuestionBankResponseSchema = createApiResponseSchema(questionBankValueSchema);
export const createQuestionBankResponseSchema = createApiResponseSchema(questionBankValueSchema);
export const deleteQuestionBankResponseSchema = createApiResponseSchema(z.unknown());
export const importQuestionsResponseSchema = createApiResponseSchema(importQuestionsValueSchema);

export type GetQuestionBanksResponse = z.infer<typeof getQuestionBanksResponseSchema>;
export type GetQuestionBanksResult = GetQuestionBanksResponse["value"];

export type GetQuestionBankResponse = z.infer<typeof getQuestionBankResponseSchema>;
export type GetQuestionBankResult = GetQuestionBankResponse["value"];

export type CreateQuestionBankResponse = z.infer<typeof createQuestionBankResponseSchema>;
export type CreateQuestionBankResult = CreateQuestionBankResponse["value"];

export type ImportQuestionsResponse = z.infer<typeof importQuestionsResponseSchema>;
export type ImportQuestionsResult = ImportQuestionsResponse["value"];
export type ImportRowError = z.infer<typeof importRowErrorSchema>;
