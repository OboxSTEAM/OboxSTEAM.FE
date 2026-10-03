import { z } from "zod";

import { mediaVideoStatusSchema } from "@/lib/api/entities/media";

/** Mirrors backend submission status on research milestone deliverables. */
export const researchSubmissionStatusSchema = z.enum([
  "Pending",
  "TurnedIn",
  "Graded",
  "ReturnedForRevision",
]);

/**
 * One evidence media asset on a submission. `fileUrl` is null while the
 * media pipeline is still transcoding a video.
 */
export const researchSubmissionEvidenceSchema = z.object({
  mediaAssetId: z.string().uuid(),
  fileUrl: z.string().nullable(),
  fileType: z.string().nullable(),
  videoStatus: mediaVideoStatusSchema,
});

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
  /** Legacy preview URLs — not index-aligned with `evidenceMediaAssetIds`; prefer `evidences`. */
  evidenceUrls: z.array(z.string()).nullable().optional(),
  /** Media asset IDs for evidence — use these on submit. */
  evidenceMediaAssetIds: z.array(z.string().uuid()).nullable().optional(),
  /** Evidence with ID, URL and pipeline status kept together. */
  evidences: z.array(researchSubmissionEvidenceSchema).nullable().optional(),
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
export type ResearchSubmissionEvidence = z.infer<typeof researchSubmissionEvidenceSchema>;
export type ResearchSubmissionUploadPayload = z.infer<
  typeof researchSubmissionUploadPayloadSchema
>;
