import { z } from "zod";

import { programLevelSchema } from "@/lib/api/entities/program";

/** Matches `ProgramEnrollmentResponseDto.status` (OpenAPI). */
export const programEnrollmentStatusSchema = z.enum([
  "PendingPayment",
  "Active",
  "Deferred",
  "Completed",
  "Failed",
  "Dropped",
]);

export const programEnrollmentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  programId: z.string().uuid(),
  status: programEnrollmentStatusSchema,
  progressPercent: z.number(),
  enrolledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  seriesName: z.string().nullable(),
  description: z.string().nullable(),
  level: programLevelSchema,
  estimatedDuration: z.string().nullable(),
  skillsGained: z.string().nullable(),
  rating: z.number().nullable(),
  totalReviews: z.number(),
  thumbnailUrl: z.string().nullable(),
  programStatus: z.string().nullable(),
  price: z.number().nullable(),
});

export type ProgramEnrollmentStatus = z.infer<typeof programEnrollmentStatusSchema>;
export type ProgramEnrollment = z.infer<typeof programEnrollmentSchema>;
