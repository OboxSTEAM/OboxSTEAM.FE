import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  approveAssessmentRecoveryRequestSchema,
  assessmentRecoveryRequestIdParamSchema,
  createAssessmentRecoveryRequestSchema,
  rejectAssessmentRecoveryRequestSchema,
} from "@/lib/validations/assessment-recovery-requests";

import {
  approveAssessmentRecoveryRequestResponseSchema,
  assessmentRecoveryRequestValueSchema,
  getMyAssessmentRecoveryRequestsResponseSchema,
  getPendingAssessmentRecoveryRequestsResponseSchema,
  rejectAssessmentRecoveryRequestResponseSchema,
  withdrawAssessmentRecoveryRequestResponseSchema,
  type ApproveAssessmentRecoveryRequestResult,
  type GetMyAssessmentRecoveryRequestsResult,
  type GetPendingAssessmentRecoveryRequestsResult,
  type RejectAssessmentRecoveryRequestResult,
  type WithdrawAssessmentRecoveryRequestResult,
} from "./schemas";

export type {
  ApproveAssessmentRecoveryRequestResponse,
  ApproveAssessmentRecoveryRequestResult,
  CreateAssessmentRecoveryRequestResponse,
  CreateAssessmentRecoveryRequestResult,
  GetMyAssessmentRecoveryRequestsResponse,
  GetMyAssessmentRecoveryRequestsResult,
  GetPendingAssessmentRecoveryRequestsResponse,
  GetPendingAssessmentRecoveryRequestsResult,
  RejectAssessmentRecoveryRequestResponse,
  RejectAssessmentRecoveryRequestResult,
  WithdrawAssessmentRecoveryRequestResponse,
  WithdrawAssessmentRecoveryRequestResult,
} from "./schemas";

export type {
  AssessmentRecoveryRequest,
  AssessmentRecoveryRequestStatus,
} from "@/lib/api/entities/assessment-recovery-request";

export type {
  ApproveAssessmentRecoveryRequestInput,
  AssessmentRecoveryRequestIdParam,
  CreateAssessmentRecoveryRequestInput,
  RejectAssessmentRecoveryRequestInput,
} from "@/lib/validations/assessment-recovery-requests";

const RECOVERY_BASE = "/api/assessment-recovery-requests";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `POST /api/assessment-recovery-requests` */
export const createAssessmentRecoveryRequest = createApiPost({
  path: RECOVERY_BASE,
  input: createAssessmentRecoveryRequestSchema,
  value: assessmentRecoveryRequestValueSchema,
});

/** `GET /api/assessment-recovery-requests/me` */
export async function getMyAssessmentRecoveryRequests(): Promise<GetMyAssessmentRecoveryRequestsResult> {
  const response = await apiFetchParsed(
    `${RECOVERY_BASE}/me`,
    getMyAssessmentRecoveryRequestsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/assessment-recovery-requests/pending` — mentor/manager/admin queue */
export async function getPendingAssessmentRecoveryRequests(): Promise<GetPendingAssessmentRecoveryRequestsResult> {
  const response = await apiFetchParsed(
    `${RECOVERY_BASE}/pending`,
    getPendingAssessmentRecoveryRequestsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/assessment-recovery-requests/{id}/withdraw` */
export async function withdrawAssessmentRecoveryRequest(
  id: string,
): Promise<WithdrawAssessmentRecoveryRequestResult> {
  const { id: requestId } = assessmentRecoveryRequestIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${RECOVERY_BASE}/${requestId}/withdraw`,
    withdrawAssessmentRecoveryRequestResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/assessment-recovery-requests/{id}/approve` */
export async function approveAssessmentRecoveryRequest(
  id: string,
  input: z.infer<typeof approveAssessmentRecoveryRequestSchema>,
): Promise<ApproveAssessmentRecoveryRequestResult> {
  const { id: requestId } = assessmentRecoveryRequestIdParamSchema.parse({ id });
  const body = approveAssessmentRecoveryRequestSchema.parse(input);

  const response = await apiFetchParsed(
    `${RECOVERY_BASE}/${requestId}/approve`,
    approveAssessmentRecoveryRequestResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/assessment-recovery-requests/{id}/reject` */
export async function rejectAssessmentRecoveryRequest(
  id: string,
  input: z.infer<typeof rejectAssessmentRecoveryRequestSchema> = {},
): Promise<RejectAssessmentRecoveryRequestResult> {
  const { id: requestId } = assessmentRecoveryRequestIdParamSchema.parse({ id });
  const body = rejectAssessmentRecoveryRequestSchema.parse(input);

  const response = await apiFetchParsed(
    `${RECOVERY_BASE}/${requestId}/reject`,
    rejectAssessmentRecoveryRequestResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
