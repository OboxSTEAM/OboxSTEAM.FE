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

export const frameworkVersionIdParamSchema = programFrameworkIdParamSchema.extend({
  versionId: z.string().uuid("ID phiên bản khung không hợp lệ."),
});

/** `null`/omitted = rule off (create) or unchanged (update); configured values start at 1. */
const ruleCountRequestSchema = z
  .number()
  .int("Phải là số nguyên.")
  .min(1, "Giá trị phải từ 1 trở lên (để trống nếu không ràng buộc).")
  .optional()
  .nullable();

const rulePercentRequestSchema = ruleCountRequestSchema.refine(
  (value) => value == null || value <= 100,
  "Tỷ lệ không vượt quá 100%.",
);

const ruleFlagRequestSchema = z.boolean().optional().nullable();

const frameworkRuleRequestShape = {
  minModules: ruleCountRequestSchema,
  maxModules: ruleCountRequestSchema,
  minCoursesPerModule: ruleCountRequestSchema,
  maxCoursesPerModule: ruleCountRequestSchema,
  minTotalHours: ruleCountRequestSchema,
  maxTotalHours: ruleCountRequestSchema,
  maxActivityMinutes: ruleCountRequestSchema,
  requireActivityDuration: ruleFlagRequestSchema,
  minOfflineSessions: ruleCountRequestSchema,
  minLiveSessions: ruleCountRequestSchema,
  minOfflineRatioPercent: rulePercentRequestSchema,
  minLiveRatioPercent: rulePercentRequestSchema,
  requireAssignmentPerModule: ruleFlagRequestSchema,
  requireAssignmentPassScore: ruleFlagRequestSchema,
  minMaterialsPerActivity: ruleCountRequestSchema,
  requireCategoryMatch: ruleFlagRequestSchema,
  minDescriptionLength: ruleCountRequestSchema,
  minSkillsGained: ruleCountRequestSchema,
  requireThumbnail: ruleFlagRequestSchema,
  requireCapstoneResearchMilestone: ruleFlagRequestSchema,
};

/** Update only: `true` switches the matching rule off (a `null` value means "unchanged"). */
const frameworkRuleClearShape = {
  clearMinModules: ruleFlagRequestSchema,
  clearMaxModules: ruleFlagRequestSchema,
  clearMinCoursesPerModule: ruleFlagRequestSchema,
  clearMaxCoursesPerModule: ruleFlagRequestSchema,
  clearMinTotalHours: ruleFlagRequestSchema,
  clearMaxTotalHours: ruleFlagRequestSchema,
  clearMaxActivityMinutes: ruleFlagRequestSchema,
  clearMinOfflineSessions: ruleFlagRequestSchema,
  clearMinLiveSessions: ruleFlagRequestSchema,
  clearMinOfflineRatioPercent: ruleFlagRequestSchema,
  clearMinLiveRatioPercent: ruleFlagRequestSchema,
  clearMinMaterialsPerActivity: ruleFlagRequestSchema,
  clearMinDescriptionLength: ruleFlagRequestSchema,
  clearMinSkillsGained: ruleFlagRequestSchema,
  clearRequireCapstoneResearchMilestone: ruleFlagRequestSchema,
};

const frameworkNameSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập tên khung.")
  .max(255, "Tên khung không được quá 255 ký tự.");
const frameworkDescriptionSchema = z
  .string()
  .trim()
  .max(4000, "Mô tả không được quá 4000 ký tự.");
const frameworkGuidanceSchema = z
  .string()
  .trim()
  .max(8000, "Hướng dẫn học thuật không được quá 8000 ký tự.");

export const createProgramFrameworkSchema = z.object({
  name: frameworkNameSchema,
  description: frameworkDescriptionSchema.optional().nullable(),
  academicGuidance: frameworkGuidanceSchema.optional().nullable(),
  category: programCategorySchema,
  ...frameworkRuleRequestShape,
});

export const updateProgramFrameworkSchema = z.object({
  name: z.string().trim().max(255).optional().nullable(),
  description: frameworkDescriptionSchema.optional().nullable(),
  academicGuidance: frameworkGuidanceSchema.optional().nullable(),
  category: programCategorySchema.optional().nullable(),
  ...frameworkRuleRequestShape,
  ...frameworkRuleClearShape,
});

/** Create dialog — rules are configured afterwards in the framework editor. */
export const frameworkCreateFormSchema = z.object({
  name: frameworkNameSchema,
  description: frameworkDescriptionSchema,
  academicGuidance: frameworkGuidanceSchema,
  category: programCategorySchema,
});

/** Numeric rule inputs stay as text so blank (= rule off) and typed values share one type. */
const ruleCountTextSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^[1-9]\d{0,3}$/.test(value),
    "Để trống để tắt quy tắc, hoặc nhập số nguyên từ 1 đến 9999.",
  );

const rulePercentTextSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || (/^[1-9]\d{0,2}$/.test(value) && Number(value) <= 100),
    "Để trống để tắt quy tắc, hoặc nhập tỷ lệ từ 1 đến 100.",
  );

const RANGE_PAIRS = [
  ["minModules", "maxModules", "Số học phần tối đa phải lớn hơn hoặc bằng tối thiểu."],
  [
    "minCoursesPerModule",
    "maxCoursesPerModule",
    "Số khóa học tối đa phải lớn hơn hoặc bằng tối thiểu.",
  ],
  ["minTotalHours", "maxTotalHours", "Tổng giờ tối đa phải lớn hơn hoặc bằng tối thiểu."],
] as const;

export const frameworkEditorFormSchema = z
  .object({
    name: frameworkNameSchema,
    description: frameworkDescriptionSchema,
    academicGuidance: frameworkGuidanceSchema,
    category: programCategorySchema,
    minModules: ruleCountTextSchema,
    maxModules: ruleCountTextSchema,
    minCoursesPerModule: ruleCountTextSchema,
    maxCoursesPerModule: ruleCountTextSchema,
    minTotalHours: ruleCountTextSchema,
    maxTotalHours: ruleCountTextSchema,
    maxActivityMinutes: ruleCountTextSchema,
    requireActivityDuration: z.boolean(),
    minOfflineSessions: ruleCountTextSchema,
    minLiveSessions: ruleCountTextSchema,
    minOfflineRatioPercent: rulePercentTextSchema,
    minLiveRatioPercent: rulePercentTextSchema,
    requireAssignmentPerModule: z.boolean(),
    requireAssignmentPassScore: z.boolean(),
    minMaterialsPerActivity: ruleCountTextSchema,
    requireCategoryMatch: z.boolean(),
    minDescriptionLength: ruleCountTextSchema,
    minSkillsGained: ruleCountTextSchema,
    requireThumbnail: z.boolean(),
    requireCapstoneResearchMilestone: z.boolean(),
  })
  .superRefine((values, ctx) => {
    for (const [minKey, maxKey, message] of RANGE_PAIRS) {
      const min = Number(values[minKey]);
      const max = Number(values[maxKey]);
      if (values[minKey] && values[maxKey] && max < min) {
        ctx.addIssue({ code: "custom", path: [maxKey], message });
      }
    }
    const offline = Number(values.minOfflineRatioPercent || 0);
    const live = Number(values.minLiveRatioPercent || 0);
    if (offline + live > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["minLiveRatioPercent"],
        message: "Tổng tỷ lệ offline và live không vượt quá 100%.",
      });
    }
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
export type FrameworkCreateFormValues = z.infer<typeof frameworkCreateFormSchema>;
export type FrameworkEditorFormValues = z.infer<typeof frameworkEditorFormSchema>;
