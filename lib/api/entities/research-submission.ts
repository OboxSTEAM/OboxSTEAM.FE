import { z } from "zod";

/** Mirrors backend submission status on research milestone deliverables. */
export const researchSubmissionStatusSchema = z.enum([
  "Pending",
  "TurnedIn",
  "Graded",
  "ReturnedForRevision",
]);

export const researchSubmissionSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  assignmentId: z.string(),
  researchMilestoneId: z.string(),
  moduleEnrollmentId: z.string().nullable(),
  studentId: z.string(),
  attemptNumber: z.number(),
  status: researchSubmissionStatusSchema,
  contentText: z.string().nullable(),
  fileUrl: z.string().nullable(),
  evidenceUrls: z.array(z.string()).nullable(),
  assignedGrade: z.number().nullable(),
  passScore: z.number(),
  maxPoints: z.number(),
  passed: z.boolean().nullable(),
  mentorFeedback: z.string().nullable(),
  verifiedBy: z.string().nullable(),
  submittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

/** Payload returned after upload; merge into submit body. */
export const researchSubmissionUploadPayloadSchema = z.object({
  contentText: z.string().nullable(),
  fileUrl: z.string().nullable(),
  evidenceUrls: z.array(z.string()).nullable(),
});

export type ResearchSubmissionStatus = z.infer<typeof researchSubmissionStatusSchema>;
export type ResearchSubmission = z.infer<typeof researchSubmissionSchema>;
export type ResearchSubmissionUploadPayload = z.infer<
  typeof researchSubmissionUploadPayloadSchema
>;
