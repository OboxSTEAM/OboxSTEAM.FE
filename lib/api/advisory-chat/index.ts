import { z } from "zod";

import {
  apiFetchParsed,
  assertApiSuccess,
  type ApiFetchOptions,
} from "@/lib/api/client";
import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/schemas";
import {
  advisoryProgramsQuerySchema,
  approveProgramSchema,
  curriculumChangesQuerySchema,
  discussionAttachmentIdParamSchema,
  discussionMessageIdParamSchema,
  discussionMessagesQuerySchema,
  discussionPinActionSchema,
  discussionPinsQuerySchema,
  editDiscussionMessageSchema,
  markCurriculumChangesSeenSchema,
  postDiscussionMessageSchema,
  recordDiscussionReadSchema,
  revokeProgramApprovalSchema,
  upgradeProgramFrameworkVersionSchema,
  type AdvisoryProgramsQuery,
  type ApproveProgramInput,
  type CurriculumChangesQuery,
  type DiscussionMessagesQuery,
  type DiscussionPinActionInput,
  type DiscussionPinsQuery,
  type EditDiscussionMessageInput,
  type MarkCurriculumChangesSeenInput,
  type PostDiscussionMessageInput,
  type RecordDiscussionReadInput,
  type RevokeProgramApprovalInput,
  type UpgradeProgramFrameworkVersionInput,
} from "@/lib/validations/advisory-chat";
import { programIdParamSchema } from "@/lib/validations/programs";

import {
  advisoryEmptyResponseSchema,
  curriculumChangesResponseSchema,
  discussionAttachmentResponseSchema,
  discussionAttachmentUrlResponseSchema,
  discussionMessageListResponseSchema,
  discussionMessageResponseSchema,
  getAdvisoryProgramsResponseSchema,
  getAdvisoryWorkspaceResponseSchema,
  getDiscussionPageResponseSchema,
  mentionCountsResponseSchema,
  mentionTargetsResponseSchema,
  programFrameworkCheckResponseSchema,
  programFrameworkCheckSchema,
  type AdvisoryWorkspace,
  type CurriculumChanges,
  type DiscussionAttachment,
  type DiscussionAttachmentUrl,
  type DiscussionMessage,
  type DiscussionPage,
  type MentionCount,
  type MentionTarget,
  type PaginatedAdvisoryPrograms,
  type ProgramFrameworkCheck,
} from "./schemas";

export * from "./schemas";

const PROGRAMS_BASE = "/api/programs";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function programPath(programId: string): string {
  const { id } = programIdParamSchema.parse({ id: programId });
  return `${PROGRAMS_BASE}/${id}`;
}

function discussionPath(programId: string): string {
  return `${programPath(programId)}/advisory-discussion`;
}

function messagePath(programId: string, messageId: string): string {
  const parsed = discussionMessageIdParamSchema.parse({ messageId });
  return `${discussionPath(programId)}/messages/${parsed.messageId}`;
}

async function getData<TData>(
  path: string,
  schema: z.ZodType<ApiEnvelope<{ data: TData }>>,
  init: ApiFetchOptions = { method: "GET" },
): Promise<TData> {
  const response = await apiFetchParsed(path, schema, init);
  assertApiSuccess(response);
  return requireApiValue(response.value).data;
}

/** `GET /api/programs/advisory-mine` — programs the current Manager/Expert participates in. */
export async function getMyAdvisoryPrograms(
  params: AdvisoryProgramsQuery = {},
): Promise<PaginatedAdvisoryPrograms> {
  const query = advisoryProgramsQuerySchema.parse(params);
  return getData(
    `${PROGRAMS_BASE}/advisory-mine${buildQueryString(query)}`,
    getAdvisoryProgramsResponseSchema,
  );
}

/** `GET /api/programs/{id}/advisory` — workspace header: status, approval, capabilities, counts. */
export async function getAdvisoryWorkspace(programId: string): Promise<AdvisoryWorkspace> {
  return getData(`${programPath(programId)}/advisory`, getAdvisoryWorkspaceResponseSchema);
}

/** `GET /api/programs/{id}/framework-check` — empty `checks[]` means no framework applies. */
export async function getAdvisoryFrameworkCheck(
  programId: string,
): Promise<ProgramFrameworkCheck> {
  return getData(
    `${programPath(programId)}/framework-check`,
    programFrameworkCheckResponseSchema,
  );
}

/** `POST /api/programs/{id}/approval/request` — Manager asks the advisor to review (Draft only). */
export async function requestProgramApproval(programId: string): Promise<AdvisoryWorkspace> {
  return getData(
    `${programPath(programId)}/approval/request`,
    getAdvisoryWorkspaceResponseSchema,
    { method: "POST" },
  );
}

/** `POST /api/programs/{id}/approval` — advisor approves the given curriculum version. */
export async function approveProgram(
  programId: string,
  input: ApproveProgramInput,
): Promise<AdvisoryWorkspace> {
  const body = approveProgramSchema.parse(input);
  return getData(`${programPath(programId)}/approval`, getAdvisoryWorkspaceResponseSchema, {
    method: "POST",
    body,
  });
}

/** `POST /api/programs/{id}/approval/revoke` — Manager reopens or advisor revokes (Approved only). */
export async function revokeProgramApproval(
  programId: string,
  input: RevokeProgramApprovalInput = {},
): Promise<AdvisoryWorkspace> {
  const body = revokeProgramApprovalSchema.parse(input);
  return getData(
    `${programPath(programId)}/approval/revoke`,
    getAdvisoryWorkspaceResponseSchema,
    { method: "POST", body },
  );
}

/**
 * `POST /api/programs/{id}/framework-version` — pins a newer published version of the
 * program's framework. Revokes the approval and returns Approved/Active/Inactive to Draft.
 */
export async function upgradeProgramFrameworkVersion(
  programId: string,
  input: UpgradeProgramFrameworkVersionInput,
): Promise<AdvisoryWorkspace> {
  const body = upgradeProgramFrameworkVersionSchema.parse(input);
  return getData(
    `${programPath(programId)}/framework-version`,
    getAdvisoryWorkspaceResponseSchema,
    { method: "POST", body },
  );
}

export async function getDiscussionMessages(
  programId: string,
  params: DiscussionMessagesQuery = {},
): Promise<DiscussionPage> {
  const query = discussionMessagesQuerySchema.parse(params);
  return getData(
    `${discussionPath(programId)}/messages${buildQueryString(query)}`,
    getDiscussionPageResponseSchema,
  );
}

export async function getDiscussionMessage(
  programId: string,
  messageId: string,
): Promise<DiscussionMessage> {
  return getData(messagePath(programId, messageId), discussionMessageResponseSchema);
}

/** Idempotent per author + `clientMessageId`; mention tokens use `@[Type:uuid]`. */
export async function postDiscussionMessage(
  programId: string,
  input: PostDiscussionMessageInput,
): Promise<DiscussionMessage> {
  const body = postDiscussionMessageSchema.parse(input);
  return getData(`${discussionPath(programId)}/messages`, discussionMessageResponseSchema, {
    method: "POST",
    body,
  });
}

export async function editDiscussionMessage(
  programId: string,
  messageId: string,
  input: EditDiscussionMessageInput,
): Promise<DiscussionMessage> {
  const body = editDiscussionMessageSchema.parse(input);
  return getData(messagePath(programId, messageId), discussionMessageResponseSchema, {
    method: "PATCH",
    body,
  });
}

export async function deleteDiscussionMessage(
  programId: string,
  messageId: string,
): Promise<void> {
  await getData(messagePath(programId, messageId), advisoryEmptyResponseSchema, {
    method: "DELETE",
  });
}

export async function pinDiscussionMessage(
  programId: string,
  messageId: string,
): Promise<DiscussionMessage> {
  return getData(`${messagePath(programId, messageId)}/pin`, discussionMessageResponseSchema, {
    method: "POST",
  });
}

export async function unpinDiscussionMessage(
  programId: string,
  messageId: string,
): Promise<DiscussionMessage> {
  return getData(`${messagePath(programId, messageId)}/pin`, discussionMessageResponseSchema, {
    method: "DELETE",
  });
}

export async function performDiscussionPinAction(
  programId: string,
  messageId: string,
  input: DiscussionPinActionInput,
): Promise<DiscussionMessage> {
  const body = discussionPinActionSchema.parse(input);
  return getData(
    `${messagePath(programId, messageId)}/pin/actions`,
    discussionMessageResponseSchema,
    { method: "POST", body },
  );
}

export async function getDiscussionPins(
  programId: string,
  params: DiscussionPinsQuery = {},
): Promise<DiscussionMessage[]> {
  const query = discussionPinsQuerySchema.parse(params);
  return getData(
    `${discussionPath(programId)}/pins${buildQueryString(query)}`,
    discussionMessageListResponseSchema,
  );
}

/** Counts are per exact component — sum on the client for module-level badges. */
export async function getMentionCounts(programId: string): Promise<MentionCount[]> {
  return getData(`${discussionPath(programId)}/mention-counts`, mentionCountsResponseSchema);
}

export async function recordDiscussionRead(
  programId: string,
  input: RecordDiscussionReadInput,
): Promise<void> {
  const body = recordDiscussionReadSchema.parse(input);
  await getData(`${discussionPath(programId)}/read`, advisoryEmptyResponseSchema, {
    method: "POST",
    body,
  });
}

/** Upload before sending; unsent uploads are purged by the BE after 24 hours. */
export async function uploadDiscussionAttachment(
  programId: string,
  file: File,
): Promise<DiscussionAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  return getData(
    `${discussionPath(programId)}/attachments`,
    discussionAttachmentResponseSchema,
    { method: "POST", body: formData },
  );
}

/** Signed URL valid for ~15 minutes — request on demand, do not cache long-term. */
export async function getDiscussionAttachmentUrl(
  programId: string,
  attachmentId: string,
): Promise<DiscussionAttachmentUrl> {
  const parsed = discussionAttachmentIdParamSchema.parse({ attachmentId });
  return getData(
    `${discussionPath(programId)}/attachments/${parsed.attachmentId}/url`,
    discussionAttachmentUrlResponseSchema,
  );
}

/** `GET /api/programs/{id}/mention-targets` — every curriculum component in tree order. */
export async function getMentionTargets(programId: string): Promise<MentionTarget[]> {
  return getData(`${programPath(programId)}/mention-targets`, mentionTargetsResponseSchema);
}

export async function getCurriculumChanges(
  programId: string,
  params: CurriculumChangesQuery = {},
): Promise<CurriculumChanges> {
  const query = curriculumChangesQuerySchema.parse(params);
  return getData(
    `${programPath(programId)}/curriculum/changes${buildQueryString(query)}`,
    curriculumChangesResponseSchema,
  );
}

/** Version must not exceed the current curriculum version (BE returns 400). */
export async function markCurriculumChangesSeen(
  programId: string,
  input: MarkCurriculumChangesSeenInput,
): Promise<void> {
  const body = markCurriculumChangesSeenSchema.parse(input);
  await getData(`${programPath(programId)}/curriculum/changes/seen`, advisoryEmptyResponseSchema, {
    method: "POST",
    body,
  });
}

/**
 * Framework check result attached to a `FRAMEWORK_CHECK_FAILED` approval error
 * (`value.data`), or `null` for any other error.
 */
export function getFrameworkCheckFromError(error: unknown): ProgramFrameworkCheck | null {
  if (!(error instanceof ApiRequestError)) return null;
  const body = error.body as {
    error?: { code?: string | null } | null;
    value?: { data?: unknown } | null;
  } | null;
  if (body?.error?.code !== "FRAMEWORK_CHECK_FAILED") return null;
  const parsed = programFrameworkCheckSchema.safeParse(body.value?.data);
  return parsed.success ? parsed.data : null;
}
