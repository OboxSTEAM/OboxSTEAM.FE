import { z } from "zod";

import { skillProficiencyLevelSchema } from "@/lib/api/entities/mentor";

export const mentorListQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

/** Path param for `GET /api/mentors/{id}` and `PUT /api/mentors/{id}/class-limit`. */
export const mentorIdParamSchema = z.object({
  mentorId: z.string().uuid("ID mentor không hợp lệ."),
});

/** Path param for `DELETE /api/mentors/me/skills/{id}`. */
export const mentorSkillIdParamSchema = z.object({
  mentorSkillId: z.string().uuid("ID kỹ năng mentor không hợp lệ."),
});

function isHttpUrl(value: string): boolean {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalNullableUrlSchema = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine(
    (value) => value == null || isHttpUrl(value),
    "URL phải bắt đầu bằng http:// hoặc https://.",
  );

/** Partial update for `PUT /api/mentors/me/profile`. */
export const updateMentorProfileSchema = z.object({
  title: z
    .string()
    .trim()
    .max(255, "Chức danh không được quá 255 ký tự.")
    .nullable()
    .optional(),
  organization: z
    .string()
    .trim()
    .max(255, "Tổ chức không được quá 255 ký tự.")
    .nullable()
    .optional(),
  bio: z
    .string()
    .trim()
    .max(4000, "Giới thiệu không được quá 4000 ký tự.")
    .nullable()
    .optional(),
  achievements: z
    .string()
    .trim()
    .max(4000, "Thành tựu không được quá 4000 ký tự.")
    .nullable()
    .optional(),
  linkedInUrl: optionalNullableUrlSchema,
});

/** Body for `POST /api/mentors/me/skills`. */
export const addMentorSkillSchema = z.object({
  skillId: z.string().uuid("ID kỹ năng không hợp lệ."),
  proficiencyLevel: skillProficiencyLevelSchema.optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Ghi chú không được quá 500 ký tự.")
    .nullable()
    .optional(),
});

/** Body for `PUT /api/mentors/{id}/class-limit`. */
export const updateMentorClassLimitSchema = z.object({
  maxConcurrentClasses: z
    .number()
    .int("Giới hạn lớp phải là số nguyên.")
    .min(1, "Giới hạn lớp tối thiểu là 1.")
    .max(50, "Giới hạn lớp tối đa là 50.")
    .nullable()
    .optional(),
});

export type MentorListQuery = z.infer<typeof mentorListQuerySchema>;
export type MentorIdParam = z.infer<typeof mentorIdParamSchema>;
export type MentorSkillIdParam = z.infer<typeof mentorSkillIdParamSchema>;
export type UpdateMentorProfileInput = z.infer<typeof updateMentorProfileSchema>;
export type AddMentorSkillInput = z.infer<typeof addMentorSkillSchema>;
export type UpdateMentorClassLimitInput = z.infer<
  typeof updateMentorClassLimitSchema
>;
