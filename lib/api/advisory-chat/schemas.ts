import { z } from "zod";

import { programStatusSchema } from "@/lib/api/entities/program";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

const nullableTextSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

const textSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? "");

const nullableUuidSchema = z
  .string()
  .uuid()
  .nullish()
  .transform((value) => value ?? null);

const countSchema = z
  .number()
  .int()
  .nullish()
  .transform((value) => value ?? 0);

const versionSchema = z.number().int().min(0);

function listOf<T extends z.ZodType>(itemSchema: T) {
  return z
    .array(itemSchema)
    .nullish()
    .transform((value): z.infer<T>[] => value ?? []);
}

export const curriculumTargetTypeSchema = z.enum([
  "Program",
  "Module",
  "Course",
  "Activity",
  "Assignment",
  "ResearchMilestone",
  "Material",
]);

export const advisoryUserRoleSchema = z.enum([
  "Admin",
  "Manager",
  "Mentor",
  "Parent",
  "Student",
  "Expert",
]);

export const advisoryApprovalStateSchema = z.enum(["None", "Approved", "Revoked"]);

export const advisoryParticipantSchema = z.object({
  userId: z.string().uuid(),
  name: textSchema,
  role: advisoryUserRoleSchema,
  isAdvisor: z.boolean(),
});

export const advisoryCapabilitiesSchema = z.object({
  canPost: z.boolean().optional().default(false),
  canPin: z.boolean().optional().default(false),
  canResolvePin: z.boolean().optional().default(false),
  canEditCurriculum: z.boolean().optional().default(false),
  canApprove: z.boolean().optional().default(false),
  canRevokeApproval: z.boolean().optional().default(false),
  canRequestApproval: z.boolean().optional().default(false),
  canPublish: z.boolean().optional().default(false),
});

const EMPTY_CAPABILITIES = advisoryCapabilitiesSchema.parse({});

export const programApprovalSummarySchema = z.object({
  id: z.string().uuid(),
  curriculumVersion: versionSchema,
  approvedAt: z.string(),
  approvedByName: nullableTextSchema,
  comment: nullableTextSchema,
});

export const advisoryWorkspaceSchema = z.object({
  programId: z.string().uuid(),
  status: programStatusSchema,
  curriculumVersion: versionSchema,
  curriculumLocked: z.boolean().optional().default(false),
  advisorExpertId: nullableUuidSchema,
  advisorName: nullableTextSchema,
  participants: listOf(advisoryParticipantSchema),
  capabilities: advisoryCapabilitiesSchema
    .nullish()
    .transform((value) => value ?? EMPTY_CAPABILITIES),
  approval: programApprovalSummarySchema.nullish().transform((value) => value ?? null),
  openPinCount: countSchema,
  addressedPinCount: countSchema,
  unreadCount: countSchema,
  frameworkCheckPassed: z.boolean().optional().default(true),
  changesSinceApprovalCount: countSchema,
  unseenChangeCount: countSchema,
  latestSequence: countSchema,
});

export const advisoryProgramItemSchema = z.object({
  programId: z.string().uuid(),
  code: textSchema,
  name: textSchema,
  status: programStatusSchema,
  frameworkVersionNumber: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
  isAdvisor: z.boolean(),
  latestActivityAt: nullableTextSchema,
  unreadCount: countSchema,
  openPinCount: countSchema,
  approvalState: advisoryApprovalStateSchema,
});

export const paginatedAdvisoryProgramsSchema = createPaginatedSchema(
  advisoryProgramItemSchema,
);

export const discussionReferenceSchema = z.object({
  id: z.string().uuid(),
  targetType: curriculumTargetTypeSchema,
  targetId: z.string().uuid(),
  capturedLabel: nullableTextSchema,
  capturedExcerpt: nullableTextSchema,
  isAvailable: z.boolean().optional().default(true),
  unavailableReason: nullableTextSchema,
});

export const discussionAttachmentSchema = z.object({
  id: z.string().uuid(),
  fileName: textSchema,
  contentType: nullableTextSchema,
  sizeBytes: countSchema,
  kind: z.enum(["Image", "File"]),
  uploaderUserId: z.string().uuid(),
  createdAt: z.string(),
});

export const discussionPinStatusSchema = z.enum(["Open", "Addressed", "Resolved"]);

export const discussionPinSchema = z.object({
  status: discussionPinStatusSchema,
  pinnedByName: nullableTextSchema,
  pinnedAt: nullableTextSchema,
  addressedByName: nullableTextSchema,
  addressedAt: nullableTextSchema,
  resolvedByName: nullableTextSchema,
  resolvedAt: nullableTextSchema,
});

export const discussionSystemEventCodeSchema = z.enum([
  "CurriculumUpdated",
  "ApprovalRequested",
  "Approved",
  "ApprovalRevoked",
  "Published",
  "AdvisorChanged",
]);

export const discussionSystemEventSchema = z.object({
  code: discussionSystemEventCodeSchema,
  payload: z.unknown().optional(),
});

export const discussionMessageSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  sequence: z.number().int(),
  cursor: nullableTextSchema,
  kind: z.enum(["User", "System"]),
  authorUserId: nullableUuidSchema,
  authorName: nullableTextSchema,
  authorRole: advisoryUserRoleSchema.nullish().transform((value) => value ?? null),
  text: textSchema,
  clientMessageId: nullableTextSchema,
  systemEvent: discussionSystemEventSchema.nullish().transform((value) => value ?? null),
  references: listOf(discussionReferenceSchema),
  attachments: listOf(discussionAttachmentSchema),
  pin: discussionPinSchema.nullish().transform((value) => value ?? null),
  createdAt: z.string(),
  editedAt: nullableTextSchema,
  isDeleted: z.boolean().optional().default(false),
});

export const discussionPageSchema = z.object({
  messages: listOf(discussionMessageSchema),
  before: nullableTextSchema,
  after: nullableTextSchema,
  hasMoreBefore: z.boolean().optional().default(false),
  hasMoreAfter: z.boolean().optional().default(false),
});

export const discussionAttachmentUrlSchema = z.object({
  url: textSchema,
  expiresAt: z.string(),
});

export const mentionCountSchema = z.object({
  targetType: curriculumTargetTypeSchema,
  targetId: z.string().uuid(),
  messageCount: countSchema,
  openPinCount: countSchema,
});

export const curriculumPathSegmentSchema = z.object({
  targetType: curriculumTargetTypeSchema,
  targetId: z.string().uuid(),
  label: textSchema,
});

export const mentionTargetSchema = z.object({
  targetType: curriculumTargetTypeSchema,
  targetId: z.string().uuid(),
  label: textSchema,
  code: nullableTextSchema,
  path: listOf(curriculumPathSegmentSchema),
  moduleId: nullableUuidSchema,
  courseId: nullableUuidSchema,
  activityId: nullableUuidSchema,
  order: countSchema,
});

export const curriculumChangeKindSchema = z.enum([
  "Created",
  "Updated",
  "Deleted",
  "Moved",
  "Reordered",
]);

export const curriculumChangeValueTypeSchema = z.enum([
  "ShortText",
  "LongText",
  "Number",
  "DurationMinutes",
  "Enum",
  "Boolean",
  "List",
  "Media",
]);

export const curriculumChangeFieldSchema = z.object({
  fieldKey: textSchema,
  label: textSchema,
  valueType: curriculumChangeValueTypeSchema,
  before: z.unknown().optional(),
  after: z.unknown().optional(),
});

export const curriculumChangeMoveSchema = z.object({
  fromParentLabel: nullableTextSchema,
  toParentLabel: nullableTextSchema,
  fromOrder: z.number().int().nullish().transform((value) => value ?? null),
  toOrder: z.number().int().nullish().transform((value) => value ?? null),
});

export const curriculumReorderedChildSchema = z.object({
  targetType: curriculumTargetTypeSchema,
  targetId: z.string().uuid(),
  label: textSchema,
  fromOrder: z.number().int().nullish().transform((value) => value ?? null),
  toOrder: z.number().int().nullish().transform((value) => value ?? null),
});

export const curriculumChangeActorSchema = z.object({
  userId: nullableUuidSchema,
  name: nullableTextSchema,
});

export const curriculumChangeItemSchema = z.object({
  targetType: curriculumTargetTypeSchema,
  targetId: z.string().uuid(),
  label: textSchema,
  path: listOf(curriculumPathSegmentSchema),
  changeKind: curriculumChangeKindSchema,
  fields: listOf(curriculumChangeFieldSchema),
  moved: curriculumChangeMoveSchema.nullish().transform((value) => value ?? null),
  reorderedChildren: listOf(curriculumReorderedChildSchema),
  changedBy: listOf(curriculumChangeActorSchema),
  lastChangedAt: z.string(),
  isUnseen: z.boolean().optional().default(false),
});

export const curriculumChangesSchema = z.object({
  fromVersion: versionSchema,
  toVersion: versionSchema,
  currentVersion: versionSchema,
  seenVersion: versionSchema,
  summary: z.object({
    created: countSchema,
    updated: countSchema,
    deleted: countSchema,
    moved: countSchema,
  }),
  items: listOf(curriculumChangeItemSchema),
});

export const affectedCurriculumLinkSchema = z.object({
  targetType: curriculumTargetTypeSchema,
  id: z.string().uuid(),
  label: textSchema,
});

export const frameworkCheckItemSchema = z.object({
  code: textSchema,
  label: textSchema,
  expected: textSchema,
  actual: textSchema,
  passed: z.boolean(),
  affectedCurriculumLinks: listOf(affectedCurriculumLinkSchema),
});

/** Empty `checks[]` with `allPassed: true` means the program has no framework. */
export const programFrameworkCheckSchema = z.object({
  programId: z.string().uuid(),
  frameworkVersionId: nullableUuidSchema,
  allPassed: z.boolean(),
  checks: listOf(frameworkCheckItemSchema),
});

const curriculumUpdatedPayloadSchema = z.object({
  actorUserId: nullableUuidSchema,
  actorName: nullableTextSchema,
  fromVersion: versionSchema,
  toVersion: versionSchema,
  changeCount: countSchema,
});

const approvalRequestedPayloadSchema = z.object({
  requestedByName: nullableTextSchema,
});

const approvedPayloadSchema = z.object({
  approvalId: nullableUuidSchema,
  curriculumVersion: versionSchema.nullish().transform((value) => value ?? null),
  approvedByName: nullableTextSchema,
  comment: nullableTextSchema,
});

export const approvalRevokeReasonSchema = z.enum([
  "ManagerReopened",
  "CurriculumEdited",
  "ExpertRevoked",
  "AdvisorChanged",
]);

const approvalRevokedPayloadSchema = z.object({
  approvalId: nullableUuidSchema,
  reason: approvalRevokeReasonSchema.nullish().transform((value) => value ?? null),
  actorName: nullableTextSchema,
  comment: nullableTextSchema,
});

const publishedPayloadSchema = z.object({
  publishedByName: nullableTextSchema,
});

const advisorChangedPayloadSchema = z.object({
  previousAdvisorName: nullableTextSchema,
  newAdvisorName: nullableTextSchema,
});

export type DiscussionSystemEventPayload =
  | { code: "CurriculumUpdated"; payload: z.infer<typeof curriculumUpdatedPayloadSchema> }
  | { code: "ApprovalRequested"; payload: z.infer<typeof approvalRequestedPayloadSchema> }
  | { code: "Approved"; payload: z.infer<typeof approvedPayloadSchema> }
  | { code: "ApprovalRevoked"; payload: z.infer<typeof approvalRevokedPayloadSchema> }
  | { code: "Published"; payload: z.infer<typeof publishedPayloadSchema> }
  | { code: "AdvisorChanged"; payload: z.infer<typeof advisorChangedPayloadSchema> };

const SYSTEM_EVENT_PAYLOAD_SCHEMAS = {
  CurriculumUpdated: curriculumUpdatedPayloadSchema,
  ApprovalRequested: approvalRequestedPayloadSchema,
  Approved: approvedPayloadSchema,
  ApprovalRevoked: approvalRevokedPayloadSchema,
  Published: publishedPayloadSchema,
  AdvisorChanged: advisorChangedPayloadSchema,
} as const;

/** Typed payload for a system message; `null` when the payload does not match its code. */
export function parseSystemEventPayload(
  event: DiscussionSystemEvent,
): DiscussionSystemEventPayload | null {
  const parsed = SYSTEM_EVENT_PAYLOAD_SCHEMAS[event.code].safeParse(event.payload ?? {});
  if (!parsed.success) return null;
  return { code: event.code, payload: parsed.data } as DiscussionSystemEventPayload;
}

export const getAdvisoryWorkspaceResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryWorkspaceSchema),
);
export const getAdvisoryProgramsResponseSchema = createApiResponseSchema(
  createApiValueSchema(paginatedAdvisoryProgramsSchema),
);
export const getDiscussionPageResponseSchema = createApiResponseSchema(
  createApiValueSchema(discussionPageSchema),
);
export const discussionMessageResponseSchema = createApiResponseSchema(
  createApiValueSchema(discussionMessageSchema),
);
export const discussionMessageListResponseSchema = createApiResponseSchema(
  createApiValueSchema(listOf(discussionMessageSchema)),
);
export const discussionAttachmentResponseSchema = createApiResponseSchema(
  createApiValueSchema(discussionAttachmentSchema),
);
export const discussionAttachmentUrlResponseSchema = createApiResponseSchema(
  createApiValueSchema(discussionAttachmentUrlSchema),
);
export const mentionCountsResponseSchema = createApiResponseSchema(
  createApiValueSchema(listOf(mentionCountSchema)),
);
export const mentionTargetsResponseSchema = createApiResponseSchema(
  createApiValueSchema(listOf(mentionTargetSchema)),
);
export const curriculumChangesResponseSchema = createApiResponseSchema(
  createApiValueSchema(curriculumChangesSchema),
);
export const programFrameworkCheckResponseSchema = createApiResponseSchema(
  createApiValueSchema(programFrameworkCheckSchema),
);
export const advisoryEmptyResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.unknown()),
);

export type CurriculumTargetType = z.infer<typeof curriculumTargetTypeSchema>;
export type AdvisoryUserRole = z.infer<typeof advisoryUserRoleSchema>;
export type AdvisoryApprovalState = z.infer<typeof advisoryApprovalStateSchema>;
export type AdvisoryChatParticipant = z.infer<typeof advisoryParticipantSchema>;
export type AdvisoryChatCapabilities = z.infer<typeof advisoryCapabilitiesSchema>;
export type ProgramApprovalSummary = z.infer<typeof programApprovalSummarySchema>;
export type AdvisoryWorkspace = z.infer<typeof advisoryWorkspaceSchema>;
export type AdvisoryProgramItem = z.infer<typeof advisoryProgramItemSchema>;
export type PaginatedAdvisoryPrograms = z.infer<typeof paginatedAdvisoryProgramsSchema>;
export type DiscussionReference = z.infer<typeof discussionReferenceSchema>;
export type DiscussionAttachment = z.infer<typeof discussionAttachmentSchema>;
export type DiscussionPinStatus = z.infer<typeof discussionPinStatusSchema>;
export type DiscussionPin = z.infer<typeof discussionPinSchema>;
export type DiscussionSystemEventCode = z.infer<typeof discussionSystemEventCodeSchema>;
export type DiscussionSystemEvent = z.infer<typeof discussionSystemEventSchema>;
export type DiscussionMessage = z.infer<typeof discussionMessageSchema>;
export type DiscussionPage = z.infer<typeof discussionPageSchema>;
export type DiscussionAttachmentUrl = z.infer<typeof discussionAttachmentUrlSchema>;
export type MentionCount = z.infer<typeof mentionCountSchema>;
export type CurriculumPathSegment = z.infer<typeof curriculumPathSegmentSchema>;
export type MentionTarget = z.infer<typeof mentionTargetSchema>;
export type CurriculumChangeKind = z.infer<typeof curriculumChangeKindSchema>;
export type CurriculumChangeValueType = z.infer<typeof curriculumChangeValueTypeSchema>;
export type CurriculumChangeField = z.infer<typeof curriculumChangeFieldSchema>;
export type CurriculumChangeMove = z.infer<typeof curriculumChangeMoveSchema>;
export type CurriculumReorderedChild = z.infer<typeof curriculumReorderedChildSchema>;
export type CurriculumChangeActor = z.infer<typeof curriculumChangeActorSchema>;
export type CurriculumChangeItem = z.infer<typeof curriculumChangeItemSchema>;
export type CurriculumChanges = z.infer<typeof curriculumChangesSchema>;
export type AffectedCurriculumLink = z.infer<typeof affectedCurriculumLinkSchema>;
export type FrameworkCheckItem = z.infer<typeof frameworkCheckItemSchema>;
export type ProgramFrameworkCheck = z.infer<typeof programFrameworkCheckSchema>;
export type ApprovalRevokeReason = z.infer<typeof approvalRevokeReasonSchema>;
