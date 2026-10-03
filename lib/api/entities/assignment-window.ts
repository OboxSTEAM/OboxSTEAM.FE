import { z } from "zod";

/**
 * `value.data` on 409 `ASSIGNMENT_WINDOW_NOT_OPEN` / `ASSIGNMENT_WINDOW_CLOSED`
 * (quiz, reflection, file-upload, research, recovery). Times are UTC.
 */
export const assignmentWindowConflictSchema = z.object({
  startTime: z.string().nullish().transform((v) => v ?? null),
  endTime: z.string().nullish().transform((v) => v ?? null),
  sessionId: z.string().nullish().transform((v) => v ?? null),
  classId: z.string().nullish().transform((v) => v ?? null),
  assignmentId: z.string().nullish().transform((v) => v ?? null),
});

export type AssignmentWindowConflict = z.infer<typeof assignmentWindowConflictSchema>;
