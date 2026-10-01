import { z } from "zod";

import { programCategorySchema } from "@/lib/api/entities/program";

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? "");

const optionalUuidSchema = z
  .string()
  .uuid()
  .nullish()
  .transform((value) => value ?? null);

/** `null` = rule off. */
const ruleNumberSchema = z
  .number()
  .int()
  .nullish()
  .transform((value) => value ?? null);

const ruleFlagSchema = z
  .boolean()
  .nullish()
  .transform((value) => value ?? false);

/** Automatic curriculum rules carried by a framework and each of its versions. */
export const frameworkRuleFieldsSchema = z.object({
  minModules: ruleNumberSchema,
  maxModules: ruleNumberSchema,
  minCoursesPerModule: ruleNumberSchema,
  maxCoursesPerModule: ruleNumberSchema,
  minTotalHours: ruleNumberSchema,
  maxTotalHours: ruleNumberSchema,
  maxActivityMinutes: ruleNumberSchema,
  requireActivityDuration: ruleFlagSchema,
  minOfflineSessions: ruleNumberSchema,
  minLiveSessions: ruleNumberSchema,
  minOfflineRatioPercent: ruleNumberSchema,
  minLiveRatioPercent: ruleNumberSchema,
  requireAssignmentPerModule: ruleFlagSchema,
  requireAssignmentPassScore: ruleFlagSchema,
  minMaterialsPerActivity: ruleNumberSchema,
  requireCategoryMatch: ruleFlagSchema,
  minDescriptionLength: ruleNumberSchema,
  minSkillsGained: ruleNumberSchema,
  requireThumbnail: ruleFlagSchema,
  requireCapstoneResearchMilestone: ruleFlagSchema,
});

export type FrameworkRuleFields = z.infer<typeof frameworkRuleFieldsSchema>;

export const programFrameworkVersionSchema = frameworkRuleFieldsSchema.extend({
  id: z.string().uuid(),
  frameworkId: z.string().uuid(),
  versionNumber: z.number().int(),
  description: nullableStringSchema,
  academicGuidance: nullableStringSchema,
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ProgramFrameworkVersion = z.infer<
  typeof programFrameworkVersionSchema
>;

export const programFrameworkSchema = frameworkRuleFieldsSchema.extend({
  id: z.string().uuid(),
  expertId: z.string().uuid(),
  expertName: nullableStringSchema,
  name: nullableStringSchema,
  description: nullableStringSchema,
  academicGuidance: nullableStringSchema.optional().transform(
    (value) => value ?? "",
  ),
  category: programCategorySchema,
  requiresExpertReview: z.boolean().nullish().transform((value) => value ?? true),
  isArchived: z.boolean().nullish().transform((value) => value ?? false),
  currentVersionId: optionalUuidSchema,
  currentVersionNumber: z.number().int().nullable().optional().transform(
    (value) => value ?? null,
  ),
  hasDraftVersion: z.boolean().nullish().transform((value) => value ?? false),
  versions: z
    .array(programFrameworkVersionSchema)
    .nullish()
    .transform((value) => value ?? []),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ProgramFramework = z.infer<typeof programFrameworkSchema>;
