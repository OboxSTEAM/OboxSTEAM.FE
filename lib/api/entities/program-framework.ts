import { z } from "zod";

import { programCategorySchema } from "@/lib/api/entities/program";

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? "");

export const frameworkRubricCriterionSchema = z.object({
  id: z.string().uuid(),
  frameworkId: z.string().uuid().nullish().transform((value) => value ?? ""),
  name: nullableStringSchema,
  description: nullableStringSchema,
  maxScore: z.number().int(),
  displayOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type FrameworkRubricCriterion = z.infer<
  typeof frameworkRubricCriterionSchema
>;

export const programFrameworkSchema = z.object({
  id: z.string().uuid(),
  expertId: z.string().uuid(),
  expertName: nullableStringSchema,
  name: nullableStringSchema,
  description: nullableStringSchema,
  category: programCategorySchema,
  minModules: z.number().int().nullable(),
  minOfflineSessions: z.number().int().nullable(),
  minLiveSessions: z.number().int().nullable(),
  requireCapstoneResearchMilestone: z.boolean().nullable(),
  criteria: z
    .array(frameworkRubricCriterionSchema)
    .nullish()
    .transform((value) => value ?? []),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type ProgramFramework = z.infer<typeof programFrameworkSchema>;
