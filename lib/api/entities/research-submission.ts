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
  /** Preview URLs for display — not sent on submit. */
  evidenceUrls: z.array(z.string()).nullable().optional(),
  /** Media asset IDs for evidence — use these on submit. */
  evidenceMediaAssetIds: z.array(z.string().uuid()).nullable().optional(),
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

/**
 * Payload from `POST /api/research-submissions/upload`.
 * Primary → `fileUrl`. Evidence (`isEvidence=true`) → `mediaAssetId` + preview `evidenceUrls`.
 */
export const researchSubmissionUploadPayloadSchema = z.object({
  submissionId: z.string().uuid(),
  fileUrl: z.string().nullable().optional(),
  mediaAssetId: z.string().uuid().nullable().optional(),
  evidenceUrls: z.array(z.string()).nullable().optional(),
});

export type ResearchSubmissionStatus = z.infer<typeof researchSubmissionStatusSchema>;
export type ResearchSubmission = z.infer<typeof researchSubmissionSchema>;
export type ResearchSubmissionUploadPayload = z.infer<
  typeof researchSubmissionUploadPayloadSchema
>;
