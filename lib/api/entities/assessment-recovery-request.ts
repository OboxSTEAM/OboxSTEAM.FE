import { z } from "zod";

export const assessmentRecoveryRequestStatusSchema = z.enum([
  "Pending",
  "Approved",
  "Rejected",
  "Withdrawn",
]);

/** `AssessmentRecoveryRequestResponseDto` */
export const assessmentRecoveryRequestSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  moduleEnrollmentId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  classId: z.string().uuid().nullable(),
  status: assessmentRecoveryRequestStatusSchema,
  studentMessage: z.string().nullable(),
  mentorNote: z.string().nullable(),
  extraAttemptsGranted: z.number().int(),
  personalDueDate: z.string().nullable(),
  personalAvailableUntil: z.string().nullable(),
  decidedAt: z.string().nullable(),
  decidedBy: z.string().uuid().nullable(),
  createdAt: z.string(),
});

export type AssessmentRecoveryRequestStatus = z.infer<
  typeof assessmentRecoveryRequestStatusSchema
>;
export type AssessmentRecoveryRequest = z.infer<
  typeof assessmentRecoveryRequestSchema
>;
