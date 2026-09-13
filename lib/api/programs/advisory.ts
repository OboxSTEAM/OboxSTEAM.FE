import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { programIdParamSchema } from "@/lib/validations/programs";
import {
  addAdvisoryMessageSchema,
  advisoryBoardQuerySchema,
  advisoryDiscussionQuerySchema,
  advisoryMineQuerySchema,
  advisoryPinsQuerySchema,
  advisoryThreadsQuerySchema,
  assignProgramAdvisorSchema,
  createAdvisoryThreadSchema,
  createAdvisoryReferenceSchema,
  postAdvisoryDiscussionMessageSchema,
  recordAdvisoryReadSchema,
  recordAdvisoryDiscussionReadSchema,
  recordAdvisoryThreadReadSchema,
  saveProgramReviewDraftSchema,
  updateAdvisoryThreadStatusSchema,
  type AddAdvisoryMessageInput,
  type AdvisoryBoardQuery,
  type AdvisoryDiscussionQuery,
  type AdvisoryMineQuery,
  type AdvisoryPinsQuery,
  type AdvisoryThreadsQuery,
  type AssignProgramAdvisorInput,
  type CreateAdvisoryThreadInput,
  type CreateAdvisoryReferenceInput,
  type PostAdvisoryDiscussionMessageInput,
  type RecordAdvisoryReadInput,
  type RecordAdvisoryDiscussionReadInput,
  type RecordAdvisoryThreadReadInput,
  type SaveProgramReviewDraftInput,
  type UpdateAdvisoryThreadStatusInput,
} from "@/lib/validations/program-advisory";

import {
  advisoryMessageMutationResponseSchema,
  advisoryDiscussionMessageResponseSchema,
  advisoryReferenceResponseSchema,
  getAdvisoryDiscussionPageResponseSchema,
  getAdvisoryThreadResponseSchema,
  getAdvisoryTimelineResponseSchema,
  advisoryThreadMutationResponseSchema,
  assignProgramAdvisorResponseSchema,
  getAdvisoryBoardResponseSchema,
  getAdvisoryAnchorFieldsResponseSchema,
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
  recordAdvisoryCursorResponseSchema,
  type AdvisoryMessageMutationResult,
  type AdvisoryDiscussionMessageResult,
  type AdvisoryReferenceResult,
  type AdvisoryThreadMutationResult,
  type AssignProgramAdvisorResult,
  type GetAdvisoryBoardResult,
  type GetAdvisoryAnchorFieldsResult,
  type GetAdvisoryMessagesResult,
  type GetAdvisoryDiscussionPageResult,
  type GetAdvisoryThreadResult,
  type GetAdvisoryTimelineResult,
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
  type RecordAdvisoryCursorResult,
} from "./advisory-schemas";

export type {
  AdvisoryMessageMutationResult,
  AdvisoryDiscussionMessageResult,
  AdvisoryReferenceResult,
  AdvisoryThreadMutationResult,
  AssignProgramAdvisorResult,
  GetAdvisoryBoardResult,
  GetAdvisoryAnchorFieldsResult,
  GetAdvisoryMessagesResult,
  GetAdvisoryDiscussionPageResult,
  GetAdvisoryThreadResult,
  GetAdvisoryTimelineResult,
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
  RecordAdvisoryCursorResult,
} from "./advisory-schemas";

export type {
  AddAdvisoryMessageInput,
  AdvisoryBoardQuery,
  AdvisoryDiscussionQuery,
  AdvisoryMineQuery,
  AdvisoryPinsQuery,
  AdvisoryThreadsQuery,
  AssignProgramAdvisorInput,
  CreateAdvisoryThreadInput,
  CreateAdvisoryReferenceInput,
  PostAdvisoryDiscussionMessageInput,
  RecordAdvisoryReadInput,
  RecordAdvisoryDiscussionReadInput,
  RecordAdvisoryThreadReadInput,
  SaveProgramReviewDraftInput,
  UpdateAdvisoryThreadStatusInput,
} from "@/lib/validations/program-advisory";

export type {
  ActivitySnapshot,
  AdvisoryAnchorField,
  AdvisoryAnchorKind,
  AdvisoryCapabilities,
  AdvisoryBoard,
  AdvisoryDiscussionMessage,
  AdvisoryFeedbackCounts,
  AdvisoryMessage,
  AdvisoryMineItem,
  AdvisoryParticipant,
  AdvisoryTargetType,
  AdvisoryThread,
  AdvisoryThreadEvent,
  AdvisoryThreadPin,
  AdvisoryThreadPinSummary,
  AdvisoryThreadStatus,
  AdvisoryThreadType,
  AdvisoryReference,
  AdvisoryWorkflowStage,
  AdvisoryWorkflowStageKey,
  AdvisoryWorkflowStageState,
  AdvisoryWorkflowTimeline,
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

export async function getAdvisoryTimeline(
  programId: string,
): Promise<GetAdvisoryTimelineResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory/timeline`,
    getAdvisoryTimelineResponseSchema,
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

export async function getAdvisoryThread(
  programId: string,
  threadId: string,
): Promise<GetAdvisoryThreadResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads/${threadId}`,
    getAdvisoryThreadResponseSchema,
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

export async function createAdvisoryReference(
  programId: string,
  input: CreateAdvisoryReferenceInput,
): Promise<AdvisoryReferenceResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = createAdvisoryReferenceSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-references`,
    advisoryReferenceResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryReference(
  programId: string,
  referenceId: string,
): Promise<AdvisoryReferenceResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-references/${referenceId}`,
    advisoryReferenceResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryAnchorFields(): Promise<GetAdvisoryAnchorFieldsResult> {
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/advisory-anchor-fields`,
    getAdvisoryAnchorFieldsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryDiscussionMessages(
  programId: string,
  params?: AdvisoryDiscussionQuery,
): Promise<GetAdvisoryDiscussionPageResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-discussion/messages${buildQueryString(params, advisoryDiscussionQuerySchema)}`,
    getAdvisoryDiscussionPageResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function postAdvisoryDiscussionMessage(
  programId: string,
  input: PostAdvisoryDiscussionMessageInput,
): Promise<AdvisoryDiscussionMessageResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = postAdvisoryDiscussionMessageSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-discussion/messages`,
    advisoryDiscussionMessageResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getAdvisoryDiscussionMessage(
  programId: string,
  messageId: string,
): Promise<AdvisoryDiscussionMessageResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-discussion/messages/${messageId}`,
    advisoryDiscussionMessageResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function recordAdvisoryThreadRead(
  programId: string,
  threadId: string,
  input: RecordAdvisoryThreadReadInput,
): Promise<RecordAdvisoryCursorResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = recordAdvisoryThreadReadSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-threads/${threadId}/read`,
    recordAdvisoryCursorResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function recordAdvisoryDiscussionRead(
  programId: string,
  input: RecordAdvisoryDiscussionReadInput,
): Promise<RecordAdvisoryCursorResult> {
  const { id } = programIdParamSchema.parse({ id: programId });
  const body = recordAdvisoryDiscussionReadSchema.parse(input);
  const response = await apiFetchParsed(
    `${PROGRAMS_BASE}/${id}/advisory-discussion/read`,
    recordAdvisoryCursorResponseSchema,
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
