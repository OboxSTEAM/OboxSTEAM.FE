import { z } from "zod";

import {
  advisoryAnchorFieldSchema,
  advisoryBoardSchema,
  advisoryDiscussionMessageSchema,
  advisoryDiscussionPageSchema,
  advisoryReferenceSchema,
  advisoryMessageSchema,
  advisoryThreadPinSummarySchema,
  advisoryThreadSchema,
  advisoryWorkflowTimelineSchema,
  frameworkCheckSchema,
  paginatedAdvisoryMineSchema,
  programAdvisoryWorkspaceSchema,
  programReviewDraftSchema,
  programReviewSubmissionDetailSchema,
  programReviewSubmissionSummarySchema,
  submissionChangesSchema,
} from "@/lib/api/entities/program-advisory";
import { programSchema } from "@/lib/api/entities/program";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const getAdvisoryMineResponseSchema = createApiResponseSchema(
  createApiValueSchema(paginatedAdvisoryMineSchema),
);

export const getProgramAdvisoryWorkspaceResponseSchema = createApiResponseSchema(
  createApiValueSchema(programAdvisoryWorkspaceSchema),
);

export const getFrameworkCheckResponseSchema = createApiResponseSchema(
  createApiValueSchema(frameworkCheckSchema),
);

export const getAdvisoryBoardResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryBoardSchema),
);

export const getAdvisoryThreadsResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.array(advisoryThreadSchema)),
);

export const getAdvisoryThreadResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryThreadSchema),
);

export const getAdvisoryTimelineResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryWorkflowTimelineSchema),
);

export const getAdvisoryThreadPinsResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.array(advisoryThreadPinSummarySchema)),
);

export const advisoryThreadMutationResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryThreadSchema),
);

export const getAdvisoryMessagesResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.array(advisoryMessageSchema)),
);

export const advisoryMessageMutationResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryMessageSchema),
);

export const advisoryReferenceResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryReferenceSchema),
);

export const getAdvisoryDiscussionPageResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryDiscussionPageSchema),
);

export const advisoryDiscussionMessageResponseSchema = createApiResponseSchema(
  createApiValueSchema(advisoryDiscussionMessageSchema),
);

export const recordAdvisoryReadResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.boolean()),
);

export const recordAdvisoryCursorResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.boolean()),
);

export const getReviewSubmissionsResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.array(programReviewSubmissionSummarySchema)),
);

export const getReviewSubmissionDetailResponseSchema = createApiResponseSchema(
  createApiValueSchema(programReviewSubmissionDetailSchema),
);

export const getSubmissionChangesResponseSchema = createApiResponseSchema(
  createApiValueSchema(submissionChangesSchema),
);

export const getReviewDraftResponseSchema = createApiResponseSchema(
  createApiValueSchema(programReviewDraftSchema),
);

export const getAdvisoryAnchorFieldsResponseSchema = createApiResponseSchema(
  createApiValueSchema(z.array(advisoryAnchorFieldSchema)),
);

export const assignProgramAdvisorResponseSchema = createApiResponseSchema(
  createApiValueSchema(programSchema),
);

export type GetAdvisoryMineResult = z.infer<
  typeof getAdvisoryMineResponseSchema
>["value"];
export type GetProgramAdvisoryWorkspaceResult = z.infer<
  typeof getProgramAdvisoryWorkspaceResponseSchema
>["value"];
export type GetFrameworkCheckResult = z.infer<
  typeof getFrameworkCheckResponseSchema
>["value"];
export type GetAdvisoryBoardResult = z.infer<
  typeof getAdvisoryBoardResponseSchema
>["value"];
export type GetAdvisoryThreadsResult = z.infer<
  typeof getAdvisoryThreadsResponseSchema
>["value"];
export type GetAdvisoryThreadResult = z.infer<
  typeof getAdvisoryThreadResponseSchema
>["value"];
export type GetAdvisoryTimelineResult = z.infer<
  typeof getAdvisoryTimelineResponseSchema
>["value"];
export type GetAdvisoryThreadPinsResult = z.infer<
  typeof getAdvisoryThreadPinsResponseSchema
>["value"];
export type AdvisoryThreadMutationResult = z.infer<
  typeof advisoryThreadMutationResponseSchema
>["value"];
export type GetAdvisoryMessagesResult = z.infer<
  typeof getAdvisoryMessagesResponseSchema
>["value"];
export type AdvisoryMessageMutationResult = z.infer<
  typeof advisoryMessageMutationResponseSchema
>["value"];
export type AdvisoryReferenceResult = z.infer<
  typeof advisoryReferenceResponseSchema
>["value"];
export type GetAdvisoryDiscussionPageResult = z.infer<
  typeof getAdvisoryDiscussionPageResponseSchema
>["value"];
export type AdvisoryDiscussionMessageResult = z.infer<
  typeof advisoryDiscussionMessageResponseSchema
>["value"];
export type RecordAdvisoryReadResult = z.infer<
  typeof recordAdvisoryReadResponseSchema
>["value"];
export type RecordAdvisoryCursorResult = z.infer<
  typeof recordAdvisoryCursorResponseSchema
>["value"];
export type GetReviewSubmissionsResult = z.infer<
  typeof getReviewSubmissionsResponseSchema
>["value"];
export type GetReviewSubmissionDetailResult = z.infer<
  typeof getReviewSubmissionDetailResponseSchema
>["value"];
export type GetSubmissionChangesResult = z.infer<
  typeof getSubmissionChangesResponseSchema
>["value"];
export type GetReviewDraftResult = z.infer<
  typeof getReviewDraftResponseSchema
>["value"];
export type GetAdvisoryAnchorFieldsResult = z.infer<
  typeof getAdvisoryAnchorFieldsResponseSchema
>["value"];
export type AssignProgramAdvisorResult = z.infer<
  typeof assignProgramAdvisorResponseSchema
>["value"];
