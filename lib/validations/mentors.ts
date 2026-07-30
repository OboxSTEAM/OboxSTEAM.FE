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

/** Path param for `DELETE|PUT /api/mentors/me/skills/{id}` and visibility toggle. */
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

const yearsOfExperienceSchema = z
  .number()
  .int("Số năm kinh nghiệm phải là số nguyên.")
  .min(0, "Số năm kinh nghiệm tối thiểu là 0.")
  .max(60, "Số năm kinh nghiệm tối đa là 60.");

const skillDescriptionSchema = z
  .string()
  .trim()
  .max(4000, "Mô tả không được quá 4000 ký tự.")
  .nullable()
  .optional();

const skillNotesSchema = z
  .string()
  .trim()
  .max(500, "Ghi chú không được quá 500 ký tự.")
  .nullable()
  .optional();

/** Evidence item for create/update mentor skill (`MentorSkillEvidenceRequestDto`). */
export const mentorSkillEvidenceInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tên bằng cấp/chứng nhận không được để trống.")
    .max(255, "Tên không được quá 255 ký tự."),
  issuer: z
    .string()
    .trim()
    .max(255, "Đơn vị cấp không được quá 255 ký tự.")
    .nullable()
    .optional(),
  url: z
    .string()
    .trim()
    .min(1, "URL bằng cấp không được để trống.")
    .max(2000, "URL không được quá 2000 ký tự.")
    .refine(isHttpUrl, "URL phải bắt đầu bằng http:// hoặc https://."),
  issuedAt: z.string().nullable().optional(),
  credentialId: z
    .string()
    .trim()
    .max(100, "Mã chứng nhận không được quá 100 ký tự.")
    .nullable()
    .optional(),
});

/** Body for `POST /api/mentors/me/skills`. */
export const addMentorSkillSchema = z.object({
  skillId: z.string().uuid("ID kỹ năng không hợp lệ."),
  proficiencyLevel: skillProficiencyLevelSchema.optional(),
  yearsOfExperience: yearsOfExperienceSchema.optional(),
  description: skillDescriptionSchema,
  notes: skillNotesSchema,
  isPublic: z.boolean().optional(),
  evidences: z.array(mentorSkillEvidenceInputSchema).max(10).optional(),
});

/**
 * Body for `PUT /api/mentors/me/skills/{id}`.
 * BE non-nullable fields fall back to defaults when omitted, so the payload
 * always carries the full editable state.
 */
export const updateMentorSkillSchema = z.object({
  proficiencyLevel: skillProficiencyLevelSchema,
  yearsOfExperience: yearsOfExperienceSchema,
  description: skillDescriptionSchema,
  notes: skillNotesSchema,
  isPublic: z.boolean(),
  evidences: z.array(mentorSkillEvidenceInputSchema).max(10).nullable().optional(),
});

/** Body for `PUT /api/mentors/me/skills/{id}/visibility`. */
export const updateMentorSkillVisibilitySchema = z.object({
  isPublic: z.boolean(),
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
export type MentorSkillEvidenceInput = z.infer<
  typeof mentorSkillEvidenceInputSchema
>;
export type AddMentorSkillInput = z.infer<typeof addMentorSkillSchema>;
export type UpdateMentorSkillInput = z.infer<typeof updateMentorSkillSchema>;
export type UpdateMentorSkillVisibilityInput = z.infer<
  typeof updateMentorSkillVisibilitySchema
>;
export type UpdateMentorClassLimitInput = z.infer<
  typeof updateMentorClassLimitSchema
>;
