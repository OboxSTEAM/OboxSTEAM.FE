import { z } from "zod";

/** Linked account row returned by parent/student link list endpoints. */
export const linkedAccountSchema = z.object({
  linkedUserId: z.coerce.string(),
  code: z.coerce.string(),
  email: z.string(),
  /** Null for shadow / pending parent accounts before profile completion. */
  fullName: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isVerified: z.boolean(),
  createdAt: z.string(),
});

export type LinkedAccount = z.infer<typeof linkedAccountSchema>;
