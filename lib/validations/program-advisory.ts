import { z } from "zod";

import {
  advisoryTargetTypeSchema,
  advisoryThreadStatusSchema,
  advisoryThreadTypeSchema,
  advisoryAnchorKindSchema,
  advisoryReferenceContextSchema,
} from "@/lib/api/entities/program-advisory";
import { programStatusSchema } from "@/lib/api/entities/program";
import { reviewCriterionScoreRequestSchema } from "@/lib/validations/curriculum-reviews";

export const advisoryMineQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  status: programStatusSchema.optional(),
  unreadOnly: z.boolean().optional(),
});

export const assignProgramAdvisorSchema = z.object({
  advisorExpertId: z.string().uuid("ID chuyên gia phụ trách không hợp lệ."),
});

export const createAdvisoryThreadSchema = z.object({
  targetType: advisoryTargetTypeSchema,
  targetId: z.string().uuid().optional().nullable(),
  type: advisoryThreadTypeSchema,
  message: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung góp ý.")
    .max(4000, "Nội dung không được quá 4000 ký tự."),
  /** Always send during PendingReview — BE returns 400 if missing. */
  submissionId: z.string().uuid().optional().nullable(),
  anchorKind: advisoryAnchorKindSchema.optional().nullable(),
  anchorField: z.string().trim().max(200).optional().nullable(),
  anchorQuote: z.string().trim().max(1000).optional().nullable(),
});

export const advisoryThreadsQuerySchema = z.object({
  submissionId: z.string().uuid().optional(),
  targetType: advisoryTargetTypeSchema.optional(),
  targetId: z.string().uuid().optional(),
  status: advisoryThreadStatusSchema.optional(),
  type: advisoryThreadTypeSchema.optional(),
  scope: z.enum(["outstanding"]).optional(),
});

export const advisoryBoardQuerySchema = z.object({
  submissionId: z.string().uuid().optional(),
});

export const advisoryPinsQuerySchema = z.object({
  submissionId: z.string().uuid().optional(),
});

export const addAdvisoryMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung tin nhắn.")
    .max(4000, "Nội dung không được quá 4000 ký tự."),
  concurrencyVersion: z.string().uuid().optional().nullable(),
});

export const advisoryThreadActionRequestSchema = z.object({
  action: z.enum(["MarkFixed", "Acknowledge", "Accept"]),
  message: z
    .string()
    .trim()
    .max(4000, "Nội dung không được quá 4000 ký tự.")
    .optional()
    .nullable(),
  concurrencyVersion: z.string().uuid().optional().nullable(),
  clientOperationId: z.string().trim().max(100).optional().nullable(),
});

export const recordAdvisoryReadSchema = z.object({
  lastReadAt: z.string().optional().nullable(),
});

export const createAdvisoryReferenceSchema = z.object({
  context: advisoryReferenceContextSchema,
  submissionId: z.string().uuid().optional().nullable(),
  targetType: advisoryTargetTypeSchema,
  targetId: z.string().uuid().optional().nullable(),
  anchorKind: advisoryAnchorKindSchema,
  fieldKey: z.string().trim().max(200).optional().nullable(),
  quote: z.string().trim().max(1000).optional().nullable(),
  quotePrefix: z.string().trim().max(500).optional().nullable(),
  quoteSuffix: z.string().trim().max(500).optional().nullable(),
});

export const recordAdvisoryThreadReadSchema = z.object({
  lastDisplayedSequence: z.number().int().min(0),
  cursor: z.string().trim().optional().nullable(),
});

export const saveProgramReviewDraftSchema = z.object({
  scores: z.array(reviewCriterionScoreRequestSchema).optional().nullable(),
  overallComment: z
    .string()
    .trim()
    .max(4000, "Nhận xét không được quá 4000 ký tự.")
    .optional()
    .nullable(),
  concurrencyVersion: z.string().uuid("Phiên bản nháp không hợp lệ."),
});

export type AdvisoryMineQuery = z.infer<typeof advisoryMineQuerySchema>;
export type AssignProgramAdvisorInput = z.infer<
  typeof assignProgramAdvisorSchema
>;
export type CreateAdvisoryThreadInput = z.infer<
  typeof createAdvisoryThreadSchema
>;
export type AdvisoryThreadsQuery = z.infer<typeof advisoryThreadsQuerySchema>;
export type AdvisoryBoardQuery = z.infer<typeof advisoryBoardQuerySchema>;
export type AdvisoryPinsQuery = z.infer<typeof advisoryPinsQuerySchema>;
export type AddAdvisoryMessageInput = z.infer<typeof addAdvisoryMessageSchema>;
export type AdvisoryThreadActionInput = z.infer<
  typeof advisoryThreadActionRequestSchema
>;
export type RecordAdvisoryReadInput = z.infer<typeof recordAdvisoryReadSchema>;
export type CreateAdvisoryReferenceInput = z.infer<
  typeof createAdvisoryReferenceSchema
>;
export type RecordAdvisoryThreadReadInput = z.infer<
  typeof recordAdvisoryThreadReadSchema
>;
export type SaveProgramReviewDraftInput = z.infer<
  typeof saveProgramReviewDraftSchema
>;
