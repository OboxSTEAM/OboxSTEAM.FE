import { z } from "zod";

export const classStudentEnrollmentStatusSchema = z.enum([
  "Active",
  "Transferred",
  "Withdrawn",
  "Completed",
]);

export const classStudentRosterSchema = z.object({
  classEnrollmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  studentCode: z.string().nullable(),
  studentName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  enrollmentStatus: classStudentEnrollmentStatusSchema,
  enrolledAt: z.string().nullable(),
});

export type ClassStudentEnrollmentStatus = z.infer<
  typeof classStudentEnrollmentStatusSchema
>;
export type ClassStudentRoster = z.infer<typeof classStudentRosterSchema>;
