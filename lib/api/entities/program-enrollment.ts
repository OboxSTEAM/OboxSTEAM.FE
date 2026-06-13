import { z } from "zod";

import { programLevelSchema } from "@/lib/api/entities/program";

export const programEnrollmentStatusSchema = z.enum([
  "Active",
  "PendingPayment",
  "Completed",
  "Cancelled",
]);

export const programEnrollmentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  programId: z.string().uuid(),
  status: programEnrollmentStatusSchema,
  progressPercent: z.number(),
  enrolledAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  code: z.string(),
  name: z.string(),
  seriesName: z.string(),
  description: z.string(),
  level: programLevelSchema,
  estimatedDuration: z.string(),
  skillsGained: z.string(),
  rating: z.number().nullable(),
  totalReviews: z.number(),
  thumbnailUrl: z.string().nullable(),
  programStatus: z.string(),
  price: z.number(),
});

export type ProgramEnrollmentStatus = z.infer<typeof programEnrollmentStatusSchema>;
export type ProgramEnrollment = z.infer<typeof programEnrollmentSchema>;
