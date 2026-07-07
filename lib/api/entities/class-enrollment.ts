import { z } from "zod";

import { classSchema } from "@/lib/api/entities/class";

export const classEnrollmentStatusSchema = z.enum([
  "Active",
  "Cancelled",
  "Completed",
]);

export const classEnrollmentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  programEnrollmentId: z.string().uuid(),
  status: classEnrollmentStatusSchema,
  enrolledAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  class: classSchema,
});

export type ClassEnrollmentStatus = z.infer<typeof classEnrollmentStatusSchema>;
export type ClassEnrollment = z.infer<typeof classEnrollmentSchema>;
