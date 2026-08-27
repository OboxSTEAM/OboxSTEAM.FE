import { z } from "zod";

export const classRedeliveryRequestStatusSchema = z.enum([
  "PendingAutoMatch",
  "MatchedPendingPayment",
  "PendingManager",
  "Approved",
  "Rejected",
  "Completed",
  "Withdrawn",
  "AwaitingClassSelection",
  "AwaitingIntensiveConsent",
]);

export const classRedeliveryResolutionTypeSchema = z.enum([
  "StudentSelectedCohort",
  "RemedialClass",
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
  intensivePaceAcceptedAt: z.string().nullable().optional(),
  resolutionType: classRedeliveryResolutionTypeSchema.nullable().optional(),
  requestMessage: z.string().nullable(),
  decisionNote: z.string().nullable(),
  decidedAt: z.string().nullable(),
  decidedBy: z.string().uuid().nullable(),
  createdAt: z.string(),
});

/** `ClassRedeliveryCandidateSessionDto` */
export const classRedeliveryCandidateSessionSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  sessionKind: z.enum(["LiveOnline", "Offline", "AssignmentWindow"]),
});

/** `ClassRedeliveryCandidateDto` */
export const classRedeliveryCandidateSchema = z.object({
  classId: z.string().uuid(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  startDate: z.string(),
  mentorId: z.string().uuid().nullable(),
  mentorName: z.string().nullable(),
  maxCapacity: z.number().int(),
  seatsTaken: z.number().int(),
  seatsRemaining: z.number().int(),
  moduleSessions: z
    .array(classRedeliveryCandidateSessionSchema)
    .nullish()
    .transform((value) => value ?? []),
});

export type ClassRedeliveryRequestStatus = z.infer<
  typeof classRedeliveryRequestStatusSchema
>;
export type ClassRedeliveryResolutionType = z.infer<
  typeof classRedeliveryResolutionTypeSchema
>;
export type ClassRedeliveryRequest = z.infer<typeof classRedeliveryRequestSchema>;
export type ClassRedeliveryCandidateSession = z.infer<
  typeof classRedeliveryCandidateSessionSchema
>;
export type ClassRedeliveryCandidate = z.infer<
  typeof classRedeliveryCandidateSchema
>;
