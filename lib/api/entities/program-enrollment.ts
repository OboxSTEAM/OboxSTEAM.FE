import { z } from "zod";

import {
  programLevelSchema,
  programStatusSchema,
} from "@/lib/api/entities/program";

/** Matches `ProgramEnrollmentResponseDto.status` (OpenAPI). */
export const programEnrollmentStatusSchema = z.enum([
  "PendingPayment",
  "Active",
  "Deferred",
  "Completed",
  "Failed",
  "Dropped",
]);

/** Matches `ProgramEnrollmentResponseDto.endReason` / `priorEndReason`. */
export const programEnrollmentEndReasonSchema = z.enum([
  "AcademicFail",
  "Withdraw",
  "Attendance",
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
  endReason: programEnrollmentEndReasonSchema.nullable(),
  endedModuleId: z.string().uuid().nullable(),
  endedAt: z.string().nullable(),
  sourceProgramEnrollmentId: z.string().uuid().nullable(),
  isRebuy: z.boolean(),
  attemptNumber: z.number().int(),
  priorStatus: programEnrollmentStatusSchema.nullable(),
  priorEndReason: programEnrollmentEndReasonSchema.nullable(),
  isSuperseded: z.boolean(),
  supersededByEnrollmentId: z.string().uuid().nullable(),
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
  programStatus: programStatusSchema.nullable(),
  price: z.number().nullable(),
});

export type ProgramEnrollmentStatus = z.infer<typeof programEnrollmentStatusSchema>;
export type ProgramEnrollmentEndReason = z.infer<
  typeof programEnrollmentEndReasonSchema
>;
export type ProgramEnrollment = z.infer<typeof programEnrollmentSchema>;
