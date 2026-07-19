import { z } from "zod";

export const sessionAttendanceStatusSchema = z.enum([
  "Expected",
  "Present",
  "Absent",
  "Excused",
  "Late",
]);

export const sessionAttendanceSchema = z.object({
  id: z.string().uuid(),
  classSessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  moduleEnrollmentId: z.string().uuid(),
  status: sessionAttendanceStatusSchema,
  checkedInAt: z.string().nullable(),
  recordedBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type SessionAttendanceStatus = z.infer<typeof sessionAttendanceStatusSchema>;
export type SessionAttendance = z.infer<typeof sessionAttendanceSchema>;
