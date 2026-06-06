import { z } from "zod";

import { moduleSchema } from "@/lib/api/entities/module";

export const programLevelSchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "AllLevels",
]);

export const programSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  seriesName: z.string(),
  description: z.string(),
  level: programLevelSchema,
  estimatedDuration: z.string(),
  skillsGained: z.string(),
  rating: z.number().nullable(),
  totalReviews: z.number(),
  thumbnailUrl: z.string().nullable(),
  status: z.string(),
  price: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const programWithModulesSchema = programSchema.extend({
  modules: z.array(moduleSchema),
});

export type ProgramLevel = z.infer<typeof programLevelSchema>;
export type Program = z.infer<typeof programSchema>;
export type ProgramWithModules = z.infer<typeof programWithModulesSchema>;
