import { z } from "zod";

/** Response from `POST /api/programs/{programId}/select-class`. */
export const programClassSelectionSchema = z.object({
  programEnrollmentId: z.string().uuid(),
  classId: z.string().uuid(),
  holdExpiresAt: z.string(),
});

export type ProgramClassSelection = z.infer<typeof programClassSelectionSchema>;
