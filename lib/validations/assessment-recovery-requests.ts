import { z } from "zod";

/** Path param for assessment-recovery-request mutation routes. */
export const assessmentRecoveryRequestIdParamSchema = z.object({
  id: z.string().uuid("ID yêu cầu phục hồi không hợp lệ."),
});

/** Body for `POST /api/assessment-recovery-requests`. */
export const createAssessmentRecoveryRequestSchema = z.object({
  moduleEnrollmentId: z.string().uuid("ID ghi danh module không hợp lệ."),
  assignmentId: z.string().uuid("ID bài tập không hợp lệ."),
  studentMessage: z.string().nullable().optional(),
});

/** Body for `POST /api/assessment-recovery-requests/{id}/approve`. */
export const approveAssessmentRecoveryRequestSchema = z.object({
  extraAttemptsGranted: z
    .number()
    .int("Số lần làm thêm phải là số nguyên.")
    .min(0, "Số lần làm thêm không hợp lệ."),
  personalDueDate: z.string().nullable().optional(),
  personalAvailableUntil: z.string().nullable().optional(),
  mentorNote: z.string().nullable().optional(),
});

/** Body for `POST /api/assessment-recovery-requests/{id}/reject`. */
export const rejectAssessmentRecoveryRequestSchema = z.object({
  mentorNote: z.string().nullable().optional(),
});

export type AssessmentRecoveryRequestIdParam = z.infer<
  typeof assessmentRecoveryRequestIdParamSchema
>;
export type CreateAssessmentRecoveryRequestInput = z.infer<
  typeof createAssessmentRecoveryRequestSchema
>;
export type ApproveAssessmentRecoveryRequestInput = z.infer<
  typeof approveAssessmentRecoveryRequestSchema
>;
export type RejectAssessmentRecoveryRequestInput = z.infer<
  typeof rejectAssessmentRecoveryRequestSchema
>;
