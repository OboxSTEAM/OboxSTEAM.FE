import { z } from "zod";

import { skillCategorySchema } from "@/lib/api/entities/skill";

export const skillSortBySchema = z.enum([
  "name",
  "code",
  "category",
  "createdAt",
]);

/** Query params for `GET /api/skills`. */
export const skillListQuerySchema = z.object({
  search: z.string().optional(),
  category: skillCategorySchema.optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  sortBy: skillSortBySchema.optional(),
  isDescending: z.boolean().optional(),
});

export type SkillListQuery = z.infer<typeof skillListQuerySchema>;
