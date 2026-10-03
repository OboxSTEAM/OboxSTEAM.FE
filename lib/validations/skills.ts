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

/** Form body for `POST /api/skills`. Empty optional strings become null at the API boundary. */
export const createSkillFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Mã kỹ năng là bắt buộc.")
    .max(50, "Mã kỹ năng không được quá 50 ký tự."),
  name: z
    .string()
    .trim()
    .min(1, "Tên kỹ năng là bắt buộc.")
    .max(255, "Tên kỹ năng không được quá 255 ký tự."),
  category: skillCategorySchema,
  subcategory: z
    .string()
    .trim()
    .max(100, "Nhánh con không được quá 100 ký tự."),
  description: z.string().trim(),
});

export type CreateSkillFormInput = z.infer<typeof createSkillFormSchema>;
