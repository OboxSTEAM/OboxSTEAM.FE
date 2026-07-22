import { z } from "zod";

export const skillCategorySchema = z.enum([
  "Science",
  "Technology",
  "Engineering",
  "Arts",
  "Math",
  "SoftSkill",
]);

/** Compact skill DTO embedded on class / mentor-board responses. */
export const skillSummarySchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  category: skillCategorySchema,
  subcategory: z.string().nullable(),
});

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillSummary = z.infer<typeof skillSummarySchema>;
