import { z } from "zod";

import { moduleTypeSchema } from "@/lib/api/entities/module";

export const moduleEnrollmentStatusSchema = z.enum([
  "PendingPayment",
  "Active",
  "Deferred",
  "Completed",
  "Failed",
  "Dropped",
]);

export const moduleEnrollmentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  moduleId: z.string(),
  programEnrollmentId: z.string(),
  status: moduleEnrollmentStatusSchema,
  progressPercent: z.number(),
  finalGrade: z.number().nullable(),
  attemptNumber: z.number(),
  assignmentFailureCount: z.number(),
  enrolledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  code: z.string().nullable(),
  programId: z.string(),
  name: z.string().nullable(),
  moduleType: moduleTypeSchema,
  moduleOrder: z.number(),
  prerequisiteModuleId: z.string().nullable(),
  isMandatory: z.boolean(),
  price: z.number(),
  retakeFee: z.number(),
});

export type ModuleEnrollmentStatus = z.infer<typeof moduleEnrollmentStatusSchema>;
export type ModuleEnrollment = z.infer<typeof moduleEnrollmentSchema>;
