import { z } from "zod";

import { assessmentRecoveryRequestSchema } from "@/lib/api/entities/assessment-recovery-request";
import { createApiResponseSchema, createApiValueSchema } from "@/lib/api/schemas";

export const assessmentRecoveryRequestValueSchema = createApiValueSchema(
  assessmentRecoveryRequestSchema,
);
export const assessmentRecoveryRequestListValueSchema = createApiValueSchema(
  z.array(assessmentRecoveryRequestSchema).nullable(),
);

export const createAssessmentRecoveryRequestResponseSchema =
  createApiResponseSchema(assessmentRecoveryRequestValueSchema);
export const getMyAssessmentRecoveryRequestsResponseSchema =
  createApiResponseSchema(assessmentRecoveryRequestListValueSchema);
export const getPendingAssessmentRecoveryRequestsResponseSchema =
  createApiResponseSchema(assessmentRecoveryRequestListValueSchema);
export const withdrawAssessmentRecoveryRequestResponseSchema =
  createApiResponseSchema(assessmentRecoveryRequestValueSchema);
export const approveAssessmentRecoveryRequestResponseSchema =
  createApiResponseSchema(assessmentRecoveryRequestValueSchema);
export const rejectAssessmentRecoveryRequestResponseSchema =
  createApiResponseSchema(assessmentRecoveryRequestValueSchema);

export type CreateAssessmentRecoveryRequestResponse = z.infer<
  typeof createAssessmentRecoveryRequestResponseSchema
>;
export type GetMyAssessmentRecoveryRequestsResponse = z.infer<
  typeof getMyAssessmentRecoveryRequestsResponseSchema
>;
export type GetPendingAssessmentRecoveryRequestsResponse = z.infer<
  typeof getPendingAssessmentRecoveryRequestsResponseSchema
>;
export type WithdrawAssessmentRecoveryRequestResponse = z.infer<
  typeof withdrawAssessmentRecoveryRequestResponseSchema
>;
export type ApproveAssessmentRecoveryRequestResponse = z.infer<
  typeof approveAssessmentRecoveryRequestResponseSchema
>;
export type RejectAssessmentRecoveryRequestResponse = z.infer<
  typeof rejectAssessmentRecoveryRequestResponseSchema
>;

export type CreateAssessmentRecoveryRequestResult =
  CreateAssessmentRecoveryRequestResponse["value"];
export type GetMyAssessmentRecoveryRequestsResult =
  GetMyAssessmentRecoveryRequestsResponse["value"];
export type GetPendingAssessmentRecoveryRequestsResult =
  GetPendingAssessmentRecoveryRequestsResponse["value"];
export type WithdrawAssessmentRecoveryRequestResult =
  WithdrawAssessmentRecoveryRequestResponse["value"];
export type ApproveAssessmentRecoveryRequestResult =
  ApproveAssessmentRecoveryRequestResponse["value"];
export type RejectAssessmentRecoveryRequestResult =
  RejectAssessmentRecoveryRequestResponse["value"];
