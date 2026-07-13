import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  assignmentIdParamSchema,
  saveQuizAnswersSchema,
  saveRetrospectiveDraftSchema,
  submissionIdParamSchema,
  submitQuizSchema,
  submitRetrospectiveSchema,
} from "@/lib/validations/assignments";
import type {
  SaveQuizAnswersInput,
  SaveRetrospectiveDraftInput,
  SubmitQuizInput,
  SubmitRetrospectiveInput,
} from "@/lib/validations/assignments";

import {
  getAssignmentByIdResponseSchema,
  getInProgressQuizResponseSchema,
  getQuizResultResponseSchema,
  getRetrospectiveSubmissionResponseSchema,
  saveQuizDraftAnswersResponseSchema,
  saveRetrospectiveDraftResponseSchema,
  startQuizAttemptResponseSchema,
  startRetrospectiveAttemptResponseSchema,
  submitQuizResponseSchema,
  submitRetrospectiveResponseSchema,
  type GetAssignmentByIdResult,
  type GetInProgressQuizResult,
  type GetQuizResultResult,
  type GetRetrospectiveSubmissionResult,
  type SaveQuizDraftAnswersResult,
  type SaveRetrospectiveDraftResult,
  type StartQuizAttemptResult,
  type StartRetrospectiveAttemptResult,
  type SubmitQuizResult,
  type SubmitRetrospectiveResult,
} from "./schemas";

export type {
  GetAssignmentByIdResponse,
  GetAssignmentByIdResult,
  GetInProgressQuizResponse,
  GetInProgressQuizResult,
  GetQuizResultResponse,
  GetQuizResultResult,
  SaveQuizDraftAnswersResponse,
  SaveQuizDraftAnswersResult,
  StartQuizAttemptResponse,
  StartQuizAttemptResult,
  SubmitQuizResponse,
  SubmitQuizResult,
  GetRetrospectiveSubmissionResponse,
  GetRetrospectiveSubmissionResult,
  SaveRetrospectiveDraftResponse,
  SaveRetrospectiveDraftResult,
  StartRetrospectiveAttemptResponse,
  StartRetrospectiveAttemptResult,
  SubmitRetrospectiveResponse,
  SubmitRetrospectiveResult,
} from "./schemas";

export type {
  AssignmentDetail,
  AssignmentType,
  EnrollmentAssignmentStatus,
  EnrollmentCurriculumAssignment,
} from "@/lib/api/entities/assignment";

export type {
  QuestionType,
  QuizAttempt,
  QuizQuestion,
  QuizQuestionOption,
  QuizResult,
  QuizSavedAnswer,
  SaveQuizDraftResult,
  SubmissionStatus,
} from "@/lib/api/entities/quiz";

export type {
  RetrospectiveAttempt,
  RetrospectiveSubmissionStatus,
} from "@/lib/api/entities/retrospective";

export type {
  SaveQuizAnswersInput,
  SaveRetrospectiveDraftInput,
  SubmitQuizInput,
  SubmitRetrospectiveInput,
} from "@/lib/validations/assignments";

const ASSIGNMENTS_BASE = "/api/assignments";
const SUBMISSIONS_BASE = "/api/submissions";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `GET /api/assignments/{assignmentId}` */
export async function getAssignmentById(
  assignmentId: string,
): Promise<GetAssignmentByIdResult> {
  const { assignmentId: parsedAssignmentId } = assignmentIdParamSchema.parse({
    assignmentId,
  });

  const response = await apiFetchParsed(
    `${ASSIGNMENTS_BASE}/${parsedAssignmentId}`,
    getAssignmentByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/assignments/{assignmentId}/quiz/start` */
export async function startQuizAttempt(
  assignmentId: string,
): Promise<StartQuizAttemptResult> {
  const { assignmentId: parsedAssignmentId } = assignmentIdParamSchema.parse({
    assignmentId,
  });

  const response = await apiFetchParsed(
    `${ASSIGNMENTS_BASE}/${parsedAssignmentId}/quiz/start`,
    startQuizAttemptResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/submissions/{submissionId}/quiz` */
export async function getInProgressQuiz(
  submissionId: string,
): Promise<GetInProgressQuizResult> {
  const { submissionId: parsedSubmissionId } = submissionIdParamSchema.parse({
    submissionId,
  });

  const response = await apiFetchParsed(
    `${SUBMISSIONS_BASE}/${parsedSubmissionId}/quiz`,
    getInProgressQuizResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/submissions/{submissionId}/quiz/answers` */
export async function saveQuizDraftAnswers(
  submissionId: string,
  input: SaveQuizAnswersInput,
): Promise<SaveQuizDraftAnswersResult> {
  const { submissionId: parsedSubmissionId } = submissionIdParamSchema.parse({
    submissionId,
  });
  const body = saveQuizAnswersSchema.parse(input);

  const response = await apiFetchParsed(
    `${SUBMISSIONS_BASE}/${parsedSubmissionId}/quiz/answers`,
    saveQuizDraftAnswersResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/submissions/{submissionId}/quiz/submit` */
export async function submitQuiz(
  submissionId: string,
  input: SubmitQuizInput,
): Promise<SubmitQuizResult> {
  const { submissionId: parsedSubmissionId } = submissionIdParamSchema.parse({
    submissionId,
  });
  const body = submitQuizSchema.parse(input);

  const response = await apiFetchParsed(
    `${SUBMISSIONS_BASE}/${parsedSubmissionId}/quiz/submit`,
    submitQuizResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/submissions/{submissionId}/quiz/result` */
export async function getQuizResult(
  submissionId: string,
): Promise<GetQuizResultResult> {
  const { submissionId: parsedSubmissionId } = submissionIdParamSchema.parse({
    submissionId,
  });

  const response = await apiFetchParsed(
    `${SUBMISSIONS_BASE}/${parsedSubmissionId}/quiz/result`,
    getQuizResultResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/assignments/{assignmentId}/quiz/result` — latest graded attempt for the student. */
export async function getAssignmentQuizResult(
  assignmentId: string,
): Promise<GetQuizResultResult> {
  const { assignmentId: parsedAssignmentId } = assignmentIdParamSchema.parse({
    assignmentId,
  });

  const response = await apiFetchParsed(
    `${ASSIGNMENTS_BASE}/${parsedAssignmentId}/quiz/result`,
    getQuizResultResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/assignments/{assignmentId}/retrospective/start` */
export async function startRetrospectiveAttempt(
  assignmentId: string,
): Promise<StartRetrospectiveAttemptResult> {
  const { assignmentId: parsedAssignmentId } = assignmentIdParamSchema.parse({
    assignmentId,
  });

  const response = await apiFetchParsed(
    `${ASSIGNMENTS_BASE}/${parsedAssignmentId}/retrospective/start`,
    startRetrospectiveAttemptResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/submissions/{submissionId}/retrospective` */
export async function getRetrospectiveSubmission(
  submissionId: string,
): Promise<GetRetrospectiveSubmissionResult> {
  const { submissionId: parsedSubmissionId } = submissionIdParamSchema.parse({
    submissionId,
  });

  const response = await apiFetchParsed(
    `${SUBMISSIONS_BASE}/${parsedSubmissionId}/retrospective`,
    getRetrospectiveSubmissionResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/submissions/{submissionId}/retrospective/draft` */
export async function saveRetrospectiveDraft(
  submissionId: string,
  input: SaveRetrospectiveDraftInput,
): Promise<SaveRetrospectiveDraftResult> {
  const { submissionId: parsedSubmissionId } = submissionIdParamSchema.parse({
    submissionId,
  });
  const body = saveRetrospectiveDraftSchema.parse(input);

  const response = await apiFetchParsed(
    `${SUBMISSIONS_BASE}/${parsedSubmissionId}/retrospective/draft`,
    saveRetrospectiveDraftResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/submissions/{submissionId}/retrospective/submit` */
export async function submitRetrospective(
  submissionId: string,
  input: SubmitRetrospectiveInput,
): Promise<SubmitRetrospectiveResult> {
  const { submissionId: parsedSubmissionId } = submissionIdParamSchema.parse({
    submissionId,
  });
  const body = submitRetrospectiveSchema.parse(input);

  const response = await apiFetchParsed(
    `${SUBMISSIONS_BASE}/${parsedSubmissionId}/retrospective/submit`,
    submitRetrospectiveResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
