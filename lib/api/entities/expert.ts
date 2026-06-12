import { z } from "zod";

export const programExpertSchema = z.object({
  expertId: z.string(),
  code: z.string(),
  fullName: z.string(),
  title: z.string(),
  organization: z.string(),
  avatarUrl: z.string(),
  linkedInUrl: z.string(),
  roleInBoard: z.string(),
});

export type ProgramExpert = z.infer<typeof programExpertSchema>;
