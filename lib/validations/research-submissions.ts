import { z } from "zod";

/** Path param for `/api/research-submissions/{submissionId}` routes. */
export const researchSubmissionIdParamSchema = z.object({
  submissionId: z.string().uuid("ID bài nộp không hợp lệ."),
});

/** Body for `POST /api/research-submissions/start`. */
export const startResearchSubmissionSchema = z.object({
  moduleEnrollmentId: z.string().uuid("ID đăng ký module không hợp lệ."),
  researchMilestoneId: z.string().uuid("ID mốc nghiên cứu không hợp lệ."),
});

/** Body for `POST /api/research-submissions/{submissionId}/submit`. */
export const submitResearchSubmissionSchema = z.object({
  contentText: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  evidenceUrls: z.array(z.string()).nullable().optional(),
});

/** Body for `POST /api/research-submissions/{submissionId}/grade`. */
export const gradeResearchSubmissionSchema = z.object({
  assignedGrade: z.number(),
  mentorFeedback: z.string().nullable().optional(),
  returnForRevision: z.boolean().optional(),
});

/** Query for `POST /api/research-submissions/{submissionId}/upload`. */
export const uploadResearchSubmissionQuerySchema = z.object({
  isEvidence: z.boolean().optional(),
});

export type ResearchSubmissionIdParam = z.infer<typeof researchSubmissionIdParamSchema>;
export type StartResearchSubmissionInput = z.infer<typeof startResearchSubmissionSchema>;
export type SubmitResearchSubmissionInput = z.infer<typeof submitResearchSubmissionSchema>;
export type GradeResearchSubmissionInput = z.infer<typeof gradeResearchSubmissionSchema>;
export type UploadResearchSubmissionQuery = z.infer<typeof uploadResearchSubmissionQuerySchema>;
