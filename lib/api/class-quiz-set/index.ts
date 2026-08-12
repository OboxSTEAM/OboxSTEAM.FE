import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";
import {
  classQuizQuestionParamsSchema,
  classQuizSetParamsSchema,
  updateClassQuizQuestionSchema,
  type UpdateClassQuizQuestionInput,
} from "@/lib/validations/class-quiz-set";

import {
  getClassQuizSetResponseSchema,
  pullClassQuizSetResponseSchema,
  updateClassQuizQuestionResponseSchema,
  type GetClassQuizSetResult,
  type PullClassQuizSetResult,
  type UpdateClassQuizQuestionResult,
} from "./schemas";

export type {
  GetClassQuizSetResponse,
  GetClassQuizSetResult,
  PullClassQuizSetResponse,
  PullClassQuizSetResult,
  UpdateClassQuizQuestionResponse,
  UpdateClassQuizQuestionResult,
} from "./schemas";

export type {
  ClassQuizQuestion,
  ClassQuizQuestionOption,
  ClassQuizQuestionSet,
} from "@/lib/api/entities/class-quiz-set";

export type { UpdateClassQuizQuestionInput };

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function quizSetBase(assignmentId: string, classId: string): string {
  return `/api/assignments/${assignmentId}/classes/${classId}/quiz-set`;
}

/**
 * `GET /api/assignments/{assignmentId}/classes/{classId}/quiz-set`
 * Returns `null` when no class set has been pulled yet (HTTP 404).
 */
export async function getClassQuizSet(
  assignmentId: string,
  classId: string,
): Promise<GetClassQuizSetResult | null> {
  const params = classQuizSetParamsSchema.parse({ assignmentId, classId });

  try {
    const response = await apiFetchParsed(
      quizSetBase(params.assignmentId, params.classId),
      getClassQuizSetResponseSchema,
      { method: "GET" },
    );
    assertApiSuccess(response);
    return requireApiValue(response.value);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** `POST .../quiz-set/pull` — create or replace unlocked class quiz set from bank. */
export async function pullClassQuizSet(
  assignmentId: string,
  classId: string,
): Promise<PullClassQuizSetResult> {
  const params = classQuizSetParamsSchema.parse({ assignmentId, classId });

  const response = await apiFetchParsed(
    `${quizSetBase(params.assignmentId, params.classId)}/pull`,
    pullClassQuizSetResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT .../quiz-set/questions/{questionId}` — edit class-scoped question copy. */
export async function updateClassQuizQuestion(
  assignmentId: string,
  classId: string,
  questionId: string,
  input: UpdateClassQuizQuestionInput,
): Promise<UpdateClassQuizQuestionResult> {
  const params = classQuizQuestionParamsSchema.parse({
    assignmentId,
    classId,
    questionId,
  });
  const body = updateClassQuizQuestionSchema.parse(input);

  const response = await apiFetchParsed(
    `${quizSetBase(params.assignmentId, params.classId)}/questions/${params.questionId}`,
    updateClassQuizQuestionResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
