import { z } from "zod";

import { programStatusSchema } from "@/lib/api/entities/program";
import { createPaginatedSchema } from "@/lib/api/entities/pagination";

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? "");

const optionalUuidSchema = z
  .string()
  .uuid()
  .nullish()
  .transform((value) => value ?? null);

export const advisoryTargetTypeSchema = z.enum([
  "Program",
  "Module",
  "Course",
  "Activity",
  "Assignment",
  "ResearchMilestone",
  "Material",
  "RubricCriterion",
]);

export const advisoryThreadTypeSchema = z.enum([
  "Suggestion",
  "RequiredChange",
]);

export const advisoryThreadStatusSchema = z.enum([
  "Open",
  "Addressed",
  "Resolved",
]);

export const reviewSubmissionStatusSchema = z.enum([
  "Pending",
  "ChangesRequested",
  "Approved",
  "Withdrawn",
]);

export const advisoryMineItemSchema = z.object({
  programId: z.string().uuid(),
  code: nullableStringSchema,
  name: nullableStringSchema,
  isAdvisor: z.boolean(),
  /** BE may omit null ints when the program has no framework version. */
  frameworkVersionNumber: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
  status: programStatusSchema,
  latestActivityAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  nextAction: nullableStringSchema,
  unreadFeedbackCount: z.number().int(),
});

export type AdvisoryMineItem = z.infer<typeof advisoryMineItemSchema>;

export const paginatedAdvisoryMineSchema =
  createPaginatedSchema(advisoryMineItemSchema);

export const advisoryFeedbackCountsSchema = z.object({
  openSuggestions: z.number().int(),
  addressedSuggestions: z.number().int(),
  resolvedSuggestions: z.number().int(),
  openRequiredChanges: z.number().int(),
  addressedRequiredChanges: z.number().int(),
  resolvedRequiredChanges: z.number().int(),
});

export type AdvisoryFeedbackCounts = z.infer<
  typeof advisoryFeedbackCountsSchema
>;

export const advisoryParticipantSchema = z.object({
  userId: z.string().uuid(),
  expertId: optionalUuidSchema,
  displayName: nullableStringSchema,
  role: nullableStringSchema,
  isAdvisor: z.boolean(),
});

export type AdvisoryParticipant = z.infer<typeof advisoryParticipantSchema>;

export const programReviewSubmissionSummarySchema = z.object({
  id: z.string().uuid(),
  submissionNumber: z.number().int(),
  status: reviewSubmissionStatusSchema,
  assignedAdvisorExpertId: z.string().uuid(),
  frameworkVersionId: optionalUuidSchema,
  submittedAt: z.string(),
  closedAt: z.string().nullable(),
  concurrencyVersion: z.string().uuid(),
});

export type ProgramReviewSubmissionSummary = z.infer<
  typeof programReviewSubmissionSummarySchema
>;

export const programAdvisoryWorkspaceSchema = z.object({
  programId: z.string().uuid(),
  code: nullableStringSchema,
  name: nullableStringSchema,
  status: programStatusSchema,
  advisorExpertId: optionalUuidSchema,
  advisorName: nullableStringSchema,
  frameworkVersionId: optionalUuidSchema,
  frameworkVersionNumber: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
  participants: z
    .array(advisoryParticipantSchema)
    .nullish()
    .transform((value) => value ?? []),
  canAdvise: z.boolean(),
  canDecide: z.boolean(),
  canEditCurriculum: z.boolean(),
  canAssignAdvisor: z.boolean(),
  latestSubmission: programReviewSubmissionSummarySchema.nullish().transform(
    (value) => value ?? null,
  ),
  feedbackCounts: advisoryFeedbackCountsSchema,
  hasUnreadFeedback: z.boolean(),
});

export type ProgramAdvisoryWorkspace = z.infer<
  typeof programAdvisoryWorkspaceSchema
>;

export const advisoryThreadSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  submissionId: optionalUuidSchema,
  authorUserId: z.string().uuid(),
  authorName: nullableStringSchema,
  targetType: advisoryTargetTypeSchema,
  targetId: optionalUuidSchema,
  targetLabel: nullableStringSchema,
  targetContext: nullableStringSchema,
  type: advisoryThreadTypeSchema,
  status: advisoryThreadStatusSchema,
  lastMessageAt: z.string(),
  createdAt: z.string(),
  messageCount: z.number().int(),
});

export type AdvisoryThread = z.infer<typeof advisoryThreadSchema>;

export const advisoryMessageSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  authorUserId: z.string().uuid(),
  authorName: nullableStringSchema,
  message: nullableStringSchema,
  createdAt: z.string(),
});

export type AdvisoryMessage = z.infer<typeof advisoryMessageSchema>;

export const programReviewSubmissionDetailSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  submissionNumber: z.number().int(),
  status: reviewSubmissionStatusSchema,
  submittedByManagerId: z.string().uuid(),
  assignedAdvisorExpertId: z.string().uuid(),
  frameworkVersionId: optionalUuidSchema,
  curriculumSnapshotJson: z.string().nullable(),
  rubricSnapshotJson: z.string().nullable(),
  submittedAt: z.string(),
  closedAt: z.string().nullable(),
  concurrencyVersion: z.string().uuid(),
});

export type ProgramReviewSubmissionDetail = z.infer<
  typeof programReviewSubmissionDetailSchema
>;

export const reviewCriterionScoreRequestSchema = z.object({
  criterionId: z.string().uuid(),
  score: z.number().int(),
  comment: z.string().nullish().transform((value) => value ?? null),
});

export const programReviewDraftSchema = z.object({
  id: optionalUuidSchema,
  submissionId: z.string().uuid(),
  scores: z
    .array(reviewCriterionScoreRequestSchema)
    .nullish()
    .transform((value) => value ?? []),
  overallComment: nullableStringSchema,
  concurrencyVersion: z.string().uuid(),
  lastSavedAt: z.string().nullable(),
});

export type ProgramReviewDraft = z.infer<typeof programReviewDraftSchema>;

export const affectedCurriculumLinkSchema = z.object({
  targetType: advisoryTargetTypeSchema,
  id: z.string().uuid(),
  label: nullableStringSchema,
});

export const frameworkCheckItemSchema = z.object({
  code: nullableStringSchema,
  label: nullableStringSchema,
  expected: nullableStringSchema,
  actual: nullableStringSchema,
  passed: z.boolean(),
  affectedCurriculumLinks: z
    .array(affectedCurriculumLinkSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const frameworkCheckSchema = z.object({
  programId: z.string().uuid(),
  frameworkVersionId: optionalUuidSchema,
  allPassed: z.boolean(),
  checks: z
    .array(frameworkCheckItemSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type FrameworkCheck = z.infer<typeof frameworkCheckSchema>;

export const submissionChangeItemSchema = z.object({
  targetType: advisoryTargetTypeSchema,
  id: z.string().uuid(),
  label: nullableStringSchema,
  field: nullableStringSchema,
  detail: nullableStringSchema,
});

export const submissionChangesSchema = z.object({
  submissionId: z.string().uuid(),
  previousSubmissionId: optionalUuidSchema,
  added: z
    .array(submissionChangeItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  removed: z
    .array(submissionChangeItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  reordered: z
    .array(submissionChangeItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  modified: z
    .array(submissionChangeItemSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type SubmissionChanges = z.infer<typeof submissionChangesSchema>;

export type AdvisoryTargetType = z.infer<typeof advisoryTargetTypeSchema>;
export type AdvisoryThreadType = z.infer<typeof advisoryThreadTypeSchema>;
export type AdvisoryThreadStatus = z.infer<typeof advisoryThreadStatusSchema>;
export type ReviewSubmissionStatus = z.infer<
  typeof reviewSubmissionStatusSchema
>;
