import { z } from "zod";

export const programEnrollmentClassSchema = z.object({
  programEnrollmentId: z.string().uuid(),
  classId: z.string().uuid().nullable(),
  classEnrollmentId: z.string().uuid().nullable(),
});

export type ProgramEnrollmentClass = z.infer<typeof programEnrollmentClassSchema>;
