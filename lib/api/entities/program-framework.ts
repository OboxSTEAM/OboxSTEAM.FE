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

export const frameworkRubricCriterionSchema = z.object({
  id: z.string().uuid(),
  frameworkId: z.string().uuid().nullish().transform((value) => value ?? ""),
  frameworkVersionId: optionalUuidSchema,
  name: nullableStringSchema,
  description: nullableStringSchema,
  evidenceGuidance: nullableStringSchema,
  maxScore: z.number().int(),
  displayOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type FrameworkRubricCriterion = z.infer<
  typeof frameworkRubricCriterionSchema
>;

export const programFrameworkVersionSchema = z.object({
  id: z.string().uuid(),
  frameworkId: z.string().uuid(),
  versionNumber: z.number().int(),
  description: nullableStringSchema,
  academicGuidance: nullableStringSchema,
  minModules: z.number().int().nullable(),
  minOfflineSessions: z.number().int().nullable(),
  minLiveSessions: z.number().int().nullable(),
  requireCapstoneResearchMilestone: z.boolean().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(),
  criteria: z
    .array(frameworkRubricCriterionSchema)
    .nullish()
    .transform((value) => value ?? []),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ProgramFrameworkVersion = z.infer<
  typeof programFrameworkVersionSchema
>;

export const programFrameworkSchema = z.object({
  id: z.string().uuid(),
  expertId: z.string().uuid(),
  expertName: nullableStringSchema,
  name: nullableStringSchema,
  description: nullableStringSchema,
  academicGuidance: nullableStringSchema.optional().transform(
    (value) => value ?? "",
  ),
  category: programCategorySchema,
  minModules: z.number().int().nullable(),
  minOfflineSessions: z.number().int().nullable(),
  minLiveSessions: z.number().int().nullable(),
  requireCapstoneResearchMilestone: z.boolean().nullable(),
  requiresExpertReview: z.boolean().nullish().transform((value) => value ?? true),
  isArchived: z.boolean().nullish().transform((value) => value ?? false),
  currentVersionId: optionalUuidSchema,
  currentVersionNumber: z.number().int().nullable().optional().transform(
    (value) => value ?? null,
  ),
  hasDraftVersion: z.boolean().nullish().transform((value) => value ?? false),
  criteria: z
    .array(frameworkRubricCriterionSchema)
    .nullish()
    .transform((value) => value ?? []),
  versions: z
    .array(programFrameworkVersionSchema)
    .nullish()
    .transform((value) => value ?? []),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ProgramFramework = z.infer<typeof programFrameworkSchema>;
