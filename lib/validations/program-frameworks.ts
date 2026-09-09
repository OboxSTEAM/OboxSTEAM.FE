import { z } from "zod";

import { programCategorySchema } from "@/lib/api/entities/program";

export const programFrameworkListQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: programCategorySchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export const programFrameworkIdParamSchema = z.object({
  id: z.string().uuid("ID khung chương trình không hợp lệ."),
});

export const frameworkCriterionIdParamSchema = programFrameworkIdParamSchema.extend({
  criterionId: z.string().uuid("ID tiêu chí không hợp lệ."),
});

export const frameworkRubricCriterionRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên tiêu chí.")
    .max(255, "Tên tiêu chí không được quá 255 ký tự."),
  description: z
    .string()
    .trim()
    .max(2000, "Mô tả không được quá 2000 ký tự.")
    .optional()
    .nullable(),
  maxScore: z
    .number()
    .int("Điểm tối đa phải là số nguyên.")
    .min(1, "Điểm tối đa tối thiểu là 1.")
    .max(100, "Điểm tối đa không vượt quá 100."),
  displayOrder: z.number().int().min(0).optional(),
});

export const createProgramFrameworkSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên khung.")
    .max(255, "Tên khung không được quá 255 ký tự."),
  description: z
    .string()
    .trim()
    .max(4000, "Mô tả không được quá 4000 ký tự.")
    .optional()
    .nullable(),
  category: programCategorySchema,
  minModules: z.number().int().min(0).optional().nullable(),
  minOfflineSessions: z.number().int().min(0).optional().nullable(),
  minLiveSessions: z.number().int().min(0).optional().nullable(),
  requireCapstoneResearchMilestone: z.boolean().optional().nullable(),
  criteria: z.array(frameworkRubricCriterionRequestSchema).optional().nullable(),
});

export const updateProgramFrameworkSchema = z.object({
  name: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  category: programCategorySchema.optional().nullable(),
  minModules: z.number().int().min(0).optional().nullable(),
  minOfflineSessions: z.number().int().min(0).optional().nullable(),
  minLiveSessions: z.number().int().min(0).optional().nullable(),
  requireCapstoneResearchMilestone: z.boolean().optional().nullable(),
  clearRequireCapstoneResearchMilestone: z.boolean().optional().nullable(),
  clearMinModules: z.boolean().optional().nullable(),
  clearMinOfflineSessions: z.boolean().optional().nullable(),
  clearMinLiveSessions: z.boolean().optional().nullable(),
});

export type ProgramFrameworkListQuery = z.infer<
  typeof programFrameworkListQuerySchema
>;
export type CreateProgramFrameworkInput = z.infer<
  typeof createProgramFrameworkSchema
>;
export type UpdateProgramFrameworkInput = z.infer<
  typeof updateProgramFrameworkSchema
>;
export type FrameworkRubricCriterionRequestInput = z.infer<
  typeof frameworkRubricCriterionRequestSchema
>;
