import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  assignmentIdParamSchema,
  assignmentListQuerySchema,
  createAssignmentSchema,
  saveQuizAnswersSchema,
  saveRetrospectiveDraftSchema,
  submissionIdParamSchema,
  submitQuizSchema,
  submitRetrospectiveSchema,
  updateAssignmentSchema,
  type AssignmentListQuery,
} from "@/lib/validations/assignments";
import type {
  SaveQuizAnswersInput,
  SaveRetrospectiveDraftInput,
  SubmitQuizInput,
  SubmitRetrospectiveInput,
  UpdateAssignmentInput,
} from "@/lib/validations/assignments";

import {
  assignmentMutationValueSchema,
  deleteAssignmentResponseSchema,
  getAssignmentByIdResponseSchema,
  getAssignmentsResponseSchema,
  getInProgressQuizResponseSchema,
  getQuizResultResponseSchema,
  getRetrospectiveSubmissionResponseSchema,
  saveQuizDraftAnswersResponseSchema,
  saveRetrospectiveDraftResponseSchema,
  startQuizAttemptResponseSchema,
  startRetrospectiveAttemptResponseSchema,
  submitQuizResponseSchema,
  submitRetrospectiveResponseSchema,
  updateAssignmentResponseSchema,
  type GetAssignmentByIdResult,
  type GetAssignmentsResult,
  type GetInProgressQuizResult,
  type GetQuizResultResult,
  type GetRetrospectiveSubmissionResult,
  type SaveQuizDraftAnswersResult,
  type SaveRetrospectiveDraftResult,
  type StartQuizAttemptResult,
  type StartRetrospectiveAttemptResult,
  type SubmitQuizResult,
  type SubmitRetrospectiveResult,
  type UpdateAssignmentResult,
} from "./schemas";

export type {
  GetAssignmentByIdResponse,
  GetAssignmentByIdResult,
  GetAssignmentsResponse,
  GetAssignmentsResult,
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
  AssignmentListItem,
  AssignmentType,
  EnrollmentAssignmentStatus,
  EnrollmentCurriculumAssignment,
} from "@/lib/api/entities/assignment";

export type { AssignmentListQuery } from "@/lib/validations/assignments";

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
  AssignmentTypeInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from "@/lib/validations/assignments";

export type {
  CreateAssignmentResponse,
  CreateAssignmentResult,
  UpdateAssignmentResponse,
  UpdateAssignmentResult,
} from "./schemas";

const ASSIGNMENTS_BASE = "/api/assignments";
const SUBMISSIONS_BASE = "/api/submissions";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildAssignmentListQuery(params?: AssignmentListQuery): string {
  if (!params) return "";
  const parsed = assignmentListQuerySchema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/assignments` — paginated list with program/module context. */
export async function getAssignments(
  params?: AssignmentListQuery,
): Promise<GetAssignmentsResult> {
  const response = await apiFetchParsed(
    `${ASSIGNMENTS_BASE}${buildAssignmentListQuery(params)}`,
    getAssignmentsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/assignments` — create an assignment (Manager/SuperAdmin). */
export const createAssignment = createApiPost({
  path: ASSIGNMENTS_BASE,
  input: createAssignmentSchema,
  value: assignmentMutationValueSchema,
});

/** `PUT /api/assignments/{assignmentId}` — update an assignment. */
export async function updateAssignment(
  assignmentId: string,
  input: UpdateAssignmentInput,
): Promise<UpdateAssignmentResult> {
  const { assignmentId: id } = assignmentIdParamSchema.parse({ assignmentId });
  const body = updateAssignmentSchema.parse(input);

  const response = await apiFetchParsed(
    `${ASSIGNMENTS_BASE}/${id}`,
    updateAssignmentResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/assignments/{assignmentId}` — soft-delete an assignment. */
export async function deleteAssignment(assignmentId: string): Promise<void> {
  const { assignmentId: id } = assignmentIdParamSchema.parse({ assignmentId });

  const response = await apiFetchParsed(
    `${ASSIGNMENTS_BASE}/${id}`,
    deleteAssignmentResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
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
