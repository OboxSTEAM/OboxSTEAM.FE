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

export const advisoryAnchorKindSchema = z.enum(["Node", "Field", "Quote"]);

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
  anchorKind: advisoryAnchorKindSchema.nullish().transform((value) => value ?? null),
  anchorField: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  anchorQuote: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  latestMessagePreview: nullableStringSchema,
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
  before: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  after: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
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
  addedCount: z.number().int().optional(),
  removedCount: z.number().int().optional(),
  reorderedCount: z.number().int().optional(),
  modifiedCount: z.number().int().optional(),
});

export type SubmissionChanges = z.infer<typeof submissionChangesSchema>;
export type SubmissionChangeItem = z.infer<typeof submissionChangeItemSchema>;

export const materialSnapshotSchema = z.object({
  id: z.string().uuid(),
  activityId: z.string().uuid(),
  title: nullableStringSchema,
  type: z.string().nullish().transform((value) => value ?? null),
  materialType: z.string().nullish().transform((value) => value ?? null),
  fileName: z.string().nullish().transform((value) => value ?? null),
  url: z.string().nullish().transform((value) => value ?? null),
  fileSizeBytes: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
});

export const activitySnapshotSchema = z.object({
  id: z.string().uuid(),
  courseId: optionalUuidSchema,
  milestoneId: optionalUuidSchema,
  name: nullableStringSchema,
  type: z.string().nullish().transform((value) => value ?? null),
  activityType: z.string().nullish().transform((value) => value ?? null),
  order: z.number().int(),
  description: z.string().nullish().transform((value) => value ?? null),
  durationMinutes: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
  requireQrCheckin: z.boolean().optional().default(false),
  requireMediaEvidence: z.boolean().optional().default(false),
  material: materialSnapshotSchema.nullish().transform((value) => value ?? null),
});

export const courseSnapshotSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullish().transform((value) => value ?? null),
  name: nullableStringSchema,
  order: z.number().int(),
  description: z.string().nullish().transform((value) => value ?? null),
  activities: z
    .array(activitySnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const assignmentSnapshotSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullish().transform((value) => value ?? null),
  moduleId: z.string().uuid(),
  courseId: optionalUuidSchema,
  title: nullableStringSchema,
  scope: z.string().nullish().transform((value) => value ?? null),
  description: z.string().nullish().transform((value) => value ?? null),
  assignmentType: z.string().nullish().transform((value) => value ?? null),
  maxPoints: z.number().int(),
  passScore: z.number(),
  isRequiredForModulePass: z.boolean().optional().default(false),
  timeLimitMinutes: z
    .number()
    .int()
    .nullish()
    .transform((value) => value ?? null),
  maxAttempts: z.number().int(),
  availableFrom: z.string().nullish().transform((value) => value ?? null),
  dueAt: z.string().nullish().transform((value) => value ?? null),
});

export const milestoneSnapshotSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullish().transform((value) => value ?? null),
  title: nullableStringSchema,
  order: z.number().int(),
  isCapstone: z.boolean(),
  description: z.string().nullish().transform((value) => value ?? null),
  assignmentId: z.string().uuid(),
  assignment: assignmentSnapshotSchema
    .nullish()
    .transform((value) => value ?? null),
  activities: z
    .array(activitySnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
  activityIds: z
    .array(z.string().uuid())
    .nullish()
    .transform((value) => value ?? []),
});

export const moduleSnapshotSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullish().transform((value) => value ?? null),
  name: nullableStringSchema,
  order: z.number().int(),
  type: z.string().nullish().transform((value) => value ?? null),
  moduleType: z.string().nullish().transform((value) => value ?? null),
  prerequisiteModuleId: optionalUuidSchema,
  isMandatory: z.boolean().optional().default(true),
  learningOutcomes: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  courses: z
    .array(courseSnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
  /** Legacy fallback — prefer `courses[].activities`. */
  activities: z
    .array(activitySnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
  materials: z
    .array(materialSnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
  assignments: z
    .array(assignmentSnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
  milestones: z
    .array(milestoneSnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const programSnapshotSchema = z.object({
  id: z.string().uuid(),
  name: nullableStringSchema,
  code: nullableStringSchema,
  description: nullableStringSchema,
  skillsGained: nullableStringSchema,
  frameworkVersionId: optionalUuidSchema,
});

export const curriculumSnapshotDocumentSchema = z.object({
  programId: z.string().uuid(),
  programName: nullableStringSchema,
  program: programSnapshotSchema.nullish().transform((value) => value ?? null),
  modules: z
    .array(moduleSnapshotSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const advisoryBoardProgramSchema = z.object({
  id: z.string().uuid(),
  name: nullableStringSchema,
  code: nullableStringSchema,
  status: programStatusSchema,
  description: nullableStringSchema,
  skillsGained: nullableStringSchema,
  frameworkVersionId: optionalUuidSchema,
});

export const advisoryThreadPinSchema = z.object({
  threadId: z.string().uuid(),
  submissionId: optionalUuidSchema,
  targetType: advisoryTargetTypeSchema,
  targetId: optionalUuidSchema,
  type: advisoryThreadTypeSchema,
  status: advisoryThreadStatusSchema,
  messageCount: z.number().int(),
  authorName: nullableStringSchema,
  lastMessagePreview: nullableStringSchema,
  lastMessageAt: z.string(),
  targetLabel: nullableStringSchema,
});

export const advisoryThreadPinSummarySchema = z.object({
  targetType: advisoryTargetTypeSchema,
  targetId: z.string().uuid(),
  openRequired: z.number().int(),
  openSuggestions: z.number().int(),
  total: z.number().int(),
});

export const frameworkHighlightSchema = z.object({
  targetType: advisoryTargetTypeSchema,
  targetId: z.string().uuid(),
  checkCode: nullableStringSchema,
  label: nullableStringSchema,
  passed: z.boolean(),
});

export const advisoryBoardSchema = z.object({
  submissionId: z.string().uuid(),
  previousSubmissionId: optionalUuidSchema,
  program: advisoryBoardProgramSchema,
  curriculum: curriculumSnapshotDocumentSchema,
  threadPins: z
    .array(advisoryThreadPinSchema)
    .nullish()
    .transform((value) => value ?? []),
  changeSummary: submissionChangesSchema
    .nullish()
    .transform((value) => value ?? null),
  frameworkHighlights: z
    .array(frameworkHighlightSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type AdvisoryTargetType = z.infer<typeof advisoryTargetTypeSchema>;
export type AdvisoryThreadType = z.infer<typeof advisoryThreadTypeSchema>;
export type AdvisoryThreadStatus = z.infer<typeof advisoryThreadStatusSchema>;
export type AdvisoryAnchorKind = z.infer<typeof advisoryAnchorKindSchema>;
export type ReviewSubmissionStatus = z.infer<
  typeof reviewSubmissionStatusSchema
>;
export type MaterialSnapshot = z.infer<typeof materialSnapshotSchema>;
export type ActivitySnapshot = z.infer<typeof activitySnapshotSchema>;
export type CourseSnapshot = z.infer<typeof courseSnapshotSchema>;
export type AssignmentSnapshot = z.infer<typeof assignmentSnapshotSchema>;
export type MilestoneSnapshot = z.infer<typeof milestoneSnapshotSchema>;
export type ModuleSnapshot = z.infer<typeof moduleSnapshotSchema>;
export type CurriculumSnapshotDocument = z.infer<
  typeof curriculumSnapshotDocumentSchema
>;
export type AdvisoryBoard = z.infer<typeof advisoryBoardSchema>;
export type AdvisoryThreadPin = z.infer<typeof advisoryThreadPinSchema>;
export type AdvisoryThreadPinSummary = z.infer<
  typeof advisoryThreadPinSummarySchema
>;
export type FrameworkHighlight = z.infer<typeof frameworkHighlightSchema>;
