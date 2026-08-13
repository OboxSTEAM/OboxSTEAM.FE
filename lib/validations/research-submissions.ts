import { z } from "zod";

/** Path param for `/api/research-submissions/{submissionId}` routes. */
export const researchSubmissionIdParamSchema = z.object({
  submissionId: z.string().uuid("ID bài nộp không hợp lệ."),
});

/** Body for `POST /api/research-submissions/submit`. */
export const submitResearchSubmissionSchema = z
  .object({
    moduleEnrollmentId: z.string().uuid("ID đăng ký module không hợp lệ."),
    researchMilestoneId: z.string().uuid("ID mốc nghiên cứu không hợp lệ."),
    contentText: z.string().nullable().optional(),
    fileUrl: z.string().nullable().optional(),
    evidenceMediaAssetIds: z.array(z.string().uuid()).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasText = Boolean(value.contentText?.trim());
    const hasFile = Boolean(value.fileUrl?.trim());
    const hasEvidence =
      (value.evidenceMediaAssetIds?.filter((id) => Boolean(id?.trim())).length ??
        0) > 0;
    if (!hasText && !hasFile && !hasEvidence) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cần ít nhất một trong: nội dung, tệp chính, hoặc minh chứng.",
      });
    }
  });

/** Body for `POST /api/research-submissions/{submissionId}/grade`. */
export const gradeResearchSubmissionSchema = z.object({
  assignedGrade: z.number(),
  mentorFeedback: z.string().nullable().optional(),
  returnForRevision: z.boolean().optional(),
});

/** Query for `POST /api/research-submissions/upload`. */
export const uploadResearchSubmissionQuerySchema = z.object({
  moduleEnrollmentId: z.string().uuid("ID đăng ký module không hợp lệ."),
  researchMilestoneId: z.string().uuid("ID mốc nghiên cứu không hợp lệ."),
  isEvidence: z.boolean().optional(),
});

export type ResearchSubmissionIdParam = z.infer<typeof researchSubmissionIdParamSchema>;
export type SubmitResearchSubmissionInput = z.infer<typeof submitResearchSubmissionSchema>;
export type GradeResearchSubmissionInput = z.infer<typeof gradeResearchSubmissionSchema>;
export type UploadResearchSubmissionQuery = z.infer<typeof uploadResearchSubmissionQuerySchema>;
