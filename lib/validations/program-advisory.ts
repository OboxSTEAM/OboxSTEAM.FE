import { z } from "zod";

import {
  advisoryTargetTypeSchema,
  advisoryThreadStatusSchema,
  advisoryThreadTypeSchema,
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
  submissionId: z.string().uuid().optional().nullable(),
});

export const addAdvisoryMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung tin nhắn.")
    .max(4000, "Nội dung không được quá 4000 ký tự."),
});

export const updateAdvisoryThreadStatusSchema = z.object({
  status: advisoryThreadStatusSchema,
  message: z
    .string()
    .trim()
    .max(4000, "Nội dung không được quá 4000 ký tự.")
    .optional()
    .nullable(),
});

export const recordAdvisoryReadSchema = z.object({
  lastReadAt: z.string().optional().nullable(),
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
export type AddAdvisoryMessageInput = z.infer<typeof addAdvisoryMessageSchema>;
export type UpdateAdvisoryThreadStatusInput = z.infer<
  typeof updateAdvisoryThreadStatusSchema
>;
export type RecordAdvisoryReadInput = z.infer<typeof recordAdvisoryReadSchema>;
export type SaveProgramReviewDraftInput = z.infer<
  typeof saveProgramReviewDraftSchema
>;
