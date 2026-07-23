import { z } from "zod";

export const mentorRoleSchema = z.enum([
  "SuperAdmin",
  "Manager",
  "Mentor",
  "Parent",
  "Student",
]);

export const mentorStatusSchema = z.enum(["Active", "Locked"]);

export const skillCategorySchema = z.enum([
  "Science",
  "Technology",
  "Engineering",
  "Arts",
  "Math",
  "SoftSkill",
]);

export const skillProficiencyLevelSchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
]);

/** Skill catalog row nested under mentor skill links. */
export const mentorSkillInfoSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  category: skillCategorySchema,
  subcategory: z.string().nullable(),
});

/** Mentor ↔ skill assignment (`GET/POST /api/mentors/.../skills`). */
export const mentorSkillSchema = z.object({
  id: z.string().uuid(),
  mentorId: z.string().uuid(),
  skillId: z.string().uuid(),
  skill: mentorSkillInfoSchema.nullable().optional(),
  proficiencyLevel: skillProficiencyLevelSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
});

/**
 * Full mentor profile from:
 * - `GET /api/mentors`
 * - `GET /api/mentors/{id}`
 * - `GET|PUT /api/mentors/me/profile`
 * - `PUT /api/mentors/{id}/class-limit`
 */
export const mentorSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: mentorRoleSchema,
  status: mentorStatusSchema,
  maxConcurrentClasses: z.number().int().nullable(),
  effectiveMaxConcurrentClasses: z.number().int(),
  assignedClassCount: z.number().int(),
  pendingRequestCount: z.number().int(),
  concurrentUsage: z.number().int(),
  title: z.string().nullable(),
  organization: z.string().nullable(),
  bio: z.string().nullable(),
  achievements: z.string().nullable(),
  linkedInUrl: z.string().nullable(),
  skills: z
    .array(mentorSkillSchema)
    .nullish()
    .transform((value) => value ?? []),
});

/**
 * Compact mentor embedded on `GET /api/classes/with-students/{classId}`.
 * Missing `code` / `email` — use `GET /api/mentors/{id}` for the full row.
 */
export const classMentorSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  title: z.string().nullable(),
  organization: z.string().nullable(),
  bio: z.string().nullable(),
  achievements: z.string().nullable(),
  linkedInUrl: z.string().nullable(),
});

export type MentorRole = z.infer<typeof mentorRoleSchema>;
export type MentorStatus = z.infer<typeof mentorStatusSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillProficiencyLevel = z.infer<typeof skillProficiencyLevelSchema>;
export type MentorSkillInfo = z.infer<typeof mentorSkillInfoSchema>;
export type MentorSkill = z.infer<typeof mentorSkillSchema>;
export type Mentor = z.infer<typeof mentorSchema>;
export type ClassMentorSummary = z.infer<typeof classMentorSummarySchema>;
