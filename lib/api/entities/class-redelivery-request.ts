import { z } from "zod";

export const classRedeliveryRequestStatusSchema = z.enum([
  "PendingAutoMatch",
  "MatchedPendingPayment",
  "PendingManager",
  "Approved",
  "Rejected",
  "Completed",
  "Withdrawn",
]);

/** `ClassRedeliveryRequestResponseDto` */
export const classRedeliveryRequestSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  moduleEnrollmentId: z.string().uuid(),
  moduleId: z.string().uuid(),
  sourceClassId: z.string().uuid(),
  requestedByUserId: z.string().uuid(),
  status: classRedeliveryRequestStatusSchema,
  targetClassId: z.string().uuid().nullable(),
  paymentId: z.string().uuid().nullable(),
  retakeModuleEnrollmentId: z.string().uuid().nullable(),
  requestMessage: z.string().nullable(),
  decisionNote: z.string().nullable(),
  decidedAt: z.string().nullable(),
  decidedBy: z.string().uuid().nullable(),
  createdAt: z.string(),
});

export type ClassRedeliveryRequestStatus = z.infer<
  typeof classRedeliveryRequestStatusSchema
>;
export type ClassRedeliveryRequest = z.infer<typeof classRedeliveryRequestSchema>;
