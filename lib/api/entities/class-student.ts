import { z } from "zod";

export const classStudentEnrollmentStatusSchema = z.enum([
  "Active",
  "Cancelled",
  "Completed",
]);

export const classStudentRosterSchema = z.object({
  classEnrollmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  studentCode: z.string(),
  studentName: z.string(),
  email: z.string(),
  phone: z.string(),
  avatarUrl: z.string().nullable(),
  enrollmentStatus: classStudentEnrollmentStatusSchema,
  enrolledAt: z.string(),
});

export type ClassStudentEnrollmentStatus = z.infer<
  typeof classStudentEnrollmentStatusSchema
>;
export type ClassStudentRoster = z.infer<typeof classStudentRosterSchema>;
