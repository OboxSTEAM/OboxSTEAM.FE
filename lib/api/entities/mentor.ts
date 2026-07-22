import { z } from "zod";

import { skillSummarySchema } from "@/lib/api/entities/skill";

export const mentorSkillProficiencySchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
]);

export const mentorSkillSchema = z.object({
  id: z.string().uuid(),
  mentorId: z.string().uuid(),
  skillId: z.string().uuid(),
  skill: skillSummarySchema.nullable().optional(),
  proficiencyLevel: mentorSkillProficiencySchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
});

export const mentorAssignmentProfileSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  maxConcurrentClasses: z.number().int().nullable(),
  effectiveMaxConcurrentClasses: z.number().int(),
  assignedClassCount: z.number().int(),
  pendingRequestCount: z.number().int(),
  concurrentUsage: z.number().int(),
  skills: z
    .array(mentorSkillSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type MentorSkillProficiency = z.infer<typeof mentorSkillProficiencySchema>;
export type MentorSkill = z.infer<typeof mentorSkillSchema>;
export type MentorAssignmentProfile = z.infer<
  typeof mentorAssignmentProfileSchema
>;
