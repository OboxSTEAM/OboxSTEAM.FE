import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { programIdParamSchema } from "@/lib/validations/programs";
import {
  addAdvisoryMessageSchema,
  advisoryBoardQuerySchema,
  advisoryMineQuerySchema,
  advisoryPinsQuerySchema,
  advisoryThreadsQuerySchema,
  assignProgramAdvisorSchema,
  createAdvisoryThreadSchema,
  recordAdvisoryReadSchema,
  saveProgramReviewDraftSchema,
  updateAdvisoryThreadStatusSchema,
  type AddAdvisoryMessageInput,
  type AdvisoryBoardQuery,
  type AdvisoryMineQuery,
  type AdvisoryPinsQuery,
  type AdvisoryThreadsQuery,
  type AssignProgramAdvisorInput,
  type CreateAdvisoryThreadInput,
  type RecordAdvisoryReadInput,
  type SaveProgramReviewDraftInput,
  type UpdateAdvisoryThreadStatusInput,
} from "@/lib/validations/program-advisory";

import {
  advisoryMessageMutationResponseSchema,
  advisoryThreadMutationResponseSchema,
  assignProgramAdvisorResponseSchema,
  getAdvisoryBoardResponseSchema,
  getAdvisoryMessagesResponseSchema,
  getAdvisoryMineResponseSchema,
  getAdvisoryThreadPinsResponseSchema,
  getAdvisoryThreadsResponseSchema,
  getFrameworkCheckResponseSchema,
  getProgramAdvisoryWorkspaceResponseSchema,
  getReviewDraftResponseSchema,
  getReviewSubmissionDetailResponseSchema,
  getReviewSubmissionsResponseSchema,
  getSubmissionChangesResponseSchema,
  recordAdvisoryReadResponseSchema,
  type AdvisoryMessageMutationResult,
  type AdvisoryThreadMutationResult,
  type AssignProgramAdvisorResult,
  type GetAdvisoryBoardResult,
  type GetAdvisoryMessagesResult,
  type GetAdvisoryMineResult,
  type GetAdvisoryThreadPinsResult,
  type GetAdvisoryThreadsResult,
  type GetFrameworkCheckResult,
  type GetProgramAdvisoryWorkspaceResult,
  type GetReviewDraftResult,
  type GetReviewSubmissionDetailResult,
  type GetReviewSubmissionsResult,
  type GetSubmissionChangesResult,
  type RecordAdvisoryReadResult,
} from "./advisory-schemas";

export type {
  AdvisoryMessageMutationResult,
  AdvisoryThreadMutationResult,
  AssignProgramAdvisorResult,
  GetAdvisoryBoardResult,
  GetAdvisoryMessagesResult,
  GetAdvisoryMineResult,
  GetAdvisoryThreadPinsResult,
  GetAdvisoryThreadsResult,
  GetFrameworkCheckResult,
  GetProgramAdvisoryWorkspaceResult,
  GetReviewDraftResult,
  GetReviewSubmissionDetailResult,
  GetReviewSubmissionsResult,
  GetSubmissionChangesResult,
  RecordAdvisoryReadResult,
} from "./advisory-schemas";

export type {
  AddAdvisoryMessageInput,
  AdvisoryBoardQuery,
  AdvisoryMineQuery,
  AdvisoryPinsQuery,
  AdvisoryThreadsQuery,
  AssignProgramAdvisorInput,
  CreateAdvisoryThreadInput,
  RecordAdvisoryReadInput,
  SaveProgramReviewDraftInput,
  UpdateAdvisoryThreadStatusInput,
} from "@/lib/validations/program-advisory";

export type {
  ActivitySnapshot,
  AdvisoryAnchorKind,
  AdvisoryBoard,
  AdvisoryFeedbackCounts,
  AdvisoryMessage,
  AdvisoryMineItem,
  AdvisoryParticipant,
  AdvisoryTargetType,
  AdvisoryThread,
  AdvisoryThreadPin,
  AdvisoryThreadPinSummary,
  AdvisoryThreadStatus,
  AdvisoryThreadType,
  AssignmentSnapshot,
  CourseSnapshot,
  CurriculumSnapshotDocument,
  FrameworkCheck,
  FrameworkHighlight,
  MaterialSnapshot,
  MilestoneSnapshot,
  ModuleSnapshot,
  ProgramAdvisoryWorkspace,
  ProgramReviewDraft,
  ProgramReviewSubmissionDetail,
  ProgramReviewSubmissionSummary,
  ReviewSubmissionStatus,
  SubmissionChangeItem,
  SubmissionChanges,
} from "@/lib/api/entities/program-advisory";

const PROGRAMS_BASE = "/api/programs";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString<T extends Record<string, unknown>>(
  params: T | undefined,
  schema: z.ZodType<T>,
): string {
  if (!params) return "";
  const parsed = schema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getAdvisoryMine(
  params?: AdvisoryMineQuery,
): Promise<GetAdvisoryMineResult> {
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/advisory-mine${buildQueryString(params, advisoryMineQuerySchema)}`,
    getAdvisoryMineResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramAdvisoryWorkspace(
  programId: string,
): Promise<GetProgramAdvisoryWorkspaceResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory`,
    getProgramAdvisoryWorkspaceResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getProgramFrameworkCheck(
  programId: string,
): Promise<GetFrameworkCheckResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/framework-check`,
    getFrameworkCheckResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryBoard(
  programId: string,
  params?: AdvisoryBoardQuery,
): Promise<GetAdvisoryBoardResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory/board${buildQueryString(params, advisoryBoardQuerySchema)}`,
    getAdvisoryBoardResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function assignProgramAdvisor(
  programId: string,
  input: AssignProgramAdvisorInput,
): Promise<AssignProgramAdvisorResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = assignProgramAdvisorSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisor`,
    assignProgramAdvisorResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryThreads(
  programId: string,
  params?: AdvisoryThreadsQuery,
): Promise<GetAdvisoryThreadsResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads${buildQueryString(params, advisoryThreadsQuerySchema)}`,
    getAdvisoryThreadsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryThreadPins(
  programId: string,
  params?: AdvisoryPinsQuery,
): Promise<GetAdvisoryThreadPinsResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads/pins${buildQueryString(params, advisoryPinsQuerySchema)}`,
    getAdvisoryThreadPinsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function createAdvisoryThread(
  programId: string,
  input: CreateAdvisoryThreadInput,
): Promise<AdvisoryThreadMutationResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = createAdvisoryThreadSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads`,
    advisoryThreadMutationResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryMessages(
  programId: string,
  threadId: string,
): Promise<GetAdvisoryMessagesResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads/${threadId}/messages`,
    getAdvisoryMessagesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function addAdvisoryMessage(
  programId: string,
  threadId: string,
  input: AddAdvisoryMessageInput,
): Promise<AdvisoryMessageMutationResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = addAdvisoryMessageSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads/${threadId}/messages`,
    advisoryMessageMutationResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateAdvisoryThreadStatus(
  programId: string,
  threadId: string,
  input: UpdateAdvisoryThreadStatusInput,
): Promise<AdvisoryThreadMutationResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = updateAdvisoryThreadStatusSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads/${threadId}/status`,
    advisoryThreadMutationResponseSchema,
    { method: "PATCH", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function recordAdvisoryRead(
  programId: string,
  input: RecordAdvisoryReadInput = {},
): Promise<RecordAdvisoryReadResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = recordAdvisoryReadSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-read`,
    recordAdvisoryReadResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getReviewSubmissions(
  programId: string,
): Promise<GetReviewSubmissionsResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/review-submissions`,
    getReviewSubmissionsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getReviewSubmission(
  programId: string,
  submissionId: string,
): Promise<GetReviewSubmissionDetailResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/review-submissions/${submissionId}`,
    getReviewSubmissionDetailResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getReviewSubmissionChanges(
  programId: string,
  submissionId: string,
): Promise<GetSubmissionChangesResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/review-submissions/${submissionId}/changes`,
    getSubmissionChangesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getReviewDraft(
  programId: string,
  submissionId: string,
): Promise<GetReviewDraftResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/review-submissions/${submissionId}/draft`,
    getReviewDraftResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function saveReviewDraft(
  programId: string,
  submissionId: string,
  input: SaveProgramReviewDraftInput,
): Promise<GetReviewDraftResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = saveProgramReviewDraftSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/review-submissions/${submissionId}/draft`,
    getReviewDraftResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
