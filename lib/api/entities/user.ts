import { z } from "zod";

/** Roles accepted by `POST /api/auth/register` (matches backend enum). */
export const registerRoleSchema = z.enum(["Student", "Parent", "Mentor"]);

export type RegisterRole = z.infer<typeof registerRoleSchema>;

export const userProfileSchema = z.object({
  id: z.string(),
  code: z.string(),
  fullName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  phone: z.string(),
  role: z.string(),
  status: z.string(),
  isEmailVerified: z.boolean(),
  createdAt: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
