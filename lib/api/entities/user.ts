import { z } from "zod";

/** Public self-register roles for `POST /api/auth/register`. Mentors are provisioned by managers. */
export const registerRoleSchema = z.enum(["Student", "Parent"]);

export type RegisterRole = z.infer<typeof registerRoleSchema>;

export const userProfileSchema = z.object({
  id: z.string(),
  code: z.string(),
  /** Null for shadow parent accounts before `complete-profile`. */
  fullName: z.string().nullable(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  isEmailVerified: z.boolean(),
  createdAt: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
