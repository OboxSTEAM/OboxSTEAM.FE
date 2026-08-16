import { z } from "zod";

import { programExpertSchema } from "@/lib/api/entities/expert";
import { moduleSchema } from "@/lib/api/entities/module";

export const programLevelSchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "AllLevels",
]);

export const programCategorySchema = z.enum([
  "Science",
  "Technology",
  "Engineering",
  "Mathematic",
  "Art",
]);

export const programSchema = z.object({
  id: z.string(),
  code: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  name: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  seriesName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  description: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  category: programCategorySchema.nullable().optional(),
  level: programLevelSchema,
  estimatedDuration: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  skillsGained: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  rating: z.number().nullable(),
  totalReviews: z.number(),
  thumbnailUrl: z.string().nullable(),
  status: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  price: z
    .number()
    .nullish()
    .transform((value) => value ?? 0),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  experts: z
    .array(programExpertSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export const programWithModulesSchema = programSchema.extend({
  modules: z
    .array(moduleSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type ProgramLevel = z.infer<typeof programLevelSchema>;
export type ProgramCategory = z.infer<typeof programCategorySchema>;
export type Program = z.infer<typeof programSchema>;
export type ProgramWithModules = z.infer<typeof programWithModulesSchema>;
