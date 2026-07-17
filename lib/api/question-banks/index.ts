import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  bankQuestionParamSchema,
  createQuestionBankSchema,
  questionBankIdParamSchema,
} from "@/lib/validations/question-banks";

import {
  deleteQuestionBankResponseSchema,
  getQuestionBankResponseSchema,
  importQuestionsResponseSchema,
  questionBankValueSchema,
  type GetQuestionBankResult,
  type ImportQuestionsResult,
} from "./schemas";

export type {
  CreateQuestionBankResponse,
  CreateQuestionBankResult,
  GetQuestionBankResponse,
  GetQuestionBankResult,
  ImportQuestionsResponse,
  ImportQuestionsResult,
  ImportRowError,
} from "./schemas";

export type { QuestionBank } from "@/lib/api/entities/question-bank";
export type {
  CreateQuestionBankInput,
  QuestionBankIdParam,
} from "@/lib/validations/question-banks";

const QUESTION_BANKS_BASE = "/api/question-banks";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `POST /api/question-banks` — create a question bank for a course. */
export const createQuestionBank = createApiPost({
  path: QUESTION_BANKS_BASE,
  input: createQuestionBankSchema,
  value: questionBankValueSchema,
});

/** `GET /api/question-banks/{questionBankId}`. */
export async function getQuestionBankById(
  questionBankId: string,
): Promise<GetQuestionBankResult> {
  const { questionBankId: id } = questionBankIdParamSchema.parse({ questionBankId });

  const response = await apiFetchParsed(
    `${QUESTION_BANKS_BASE}/${id}`,
    getQuestionBankResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/question-banks/{questionBankId}` — soft-delete bank + questions. */
export async function deleteQuestionBank(questionBankId: string): Promise<void> {
  const { questionBankId: id } = questionBankIdParamSchema.parse({ questionBankId });

  const response = await apiFetchParsed(
    `${QUESTION_BANKS_BASE}/${id}`,
    deleteQuestionBankResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
}

/** `DELETE /api/question-banks/{questionBankId}/questions/{questionId}` — remove one question. */
export async function deleteBankQuestion(
  questionBankId: string,
  questionId: string,
): Promise<void> {
  const parsed = bankQuestionParamSchema.parse({ questionBankId, questionId });

  const response = await apiFetchParsed(
    `${QUESTION_BANKS_BASE}/${parsed.questionBankId}/questions/${parsed.questionId}`,
    deleteQuestionBankResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
}

/** `POST /api/question-banks/{questionBankId}/import` — import questions from a CSV file. */
export async function importBankQuestions(
  questionBankId: string,
  file: File,
): Promise<ImportQuestionsResult> {
  const { questionBankId: id } = questionBankIdParamSchema.parse({ questionBankId });

  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetchParsed(
    `${QUESTION_BANKS_BASE}/${id}/import`,
    importQuestionsResponseSchema,
    { method: "POST", body: formData },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
