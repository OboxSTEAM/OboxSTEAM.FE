import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  assignTargetClassRedeliveryRequestSchema,
  classRedeliveryRequestIdParamSchema,
  createClassRedeliveryRequestSchema,
  openRemedialClassSchema,
  rejectClassRedeliveryRequestSchema,
  selectClassRedeliveryRequestSchema,
} from "@/lib/validations/class-redelivery-requests";

import {
  acceptIntensiveClassRedeliveryRequestResponseSchema,
  assignTargetClassRedeliveryRequestResponseSchema,
  classRedeliveryRequestValueSchema,
  declineIntensiveClassRedeliveryRequestResponseSchema,
  getClassRedeliveryCandidatesResponseSchema,
  getManagerRedeliveryWaitlistResponseSchema,
  getMyClassRedeliveryRequestsResponseSchema,
  getPendingManagerClassRedeliveryRequestsResponseSchema,
  openRemedialClassResponseSchema,
  openRemedialClassValueSchema,
  rejectClassRedeliveryRequestResponseSchema,
  selectClassRedeliveryRequestResponseSchema,
  withdrawClassRedeliveryRequestResponseSchema,
  type AcceptIntensiveClassRedeliveryRequestResult,
  type AssignTargetClassRedeliveryRequestResult,
  type DeclineIntensiveClassRedeliveryRequestResult,
  type GetClassRedeliveryCandidatesResult,
  type GetManagerRedeliveryWaitlistResult,
  type GetMyClassRedeliveryRequestsResult,
  type GetPendingManagerClassRedeliveryRequestsResult,
  type OpenRemedialClassResultValue,
  type RejectClassRedeliveryRequestResult,
  type SelectClassRedeliveryRequestResult,
  type WithdrawClassRedeliveryRequestResult,
} from "./schemas";

export type {
  AcceptIntensiveClassRedeliveryRequestResponse,
  AcceptIntensiveClassRedeliveryRequestResult,
  AssignTargetClassRedeliveryRequestResponse,
  AssignTargetClassRedeliveryRequestResult,
  CreateClassRedeliveryRequestResponse,
  CreateClassRedeliveryRequestResult,
  DeclineIntensiveClassRedeliveryRequestResponse,
  DeclineIntensiveClassRedeliveryRequestResult,
  GetClassRedeliveryCandidatesResponse,
  GetClassRedeliveryCandidatesResult,
  GetManagerRedeliveryWaitlistResponse,
  GetManagerRedeliveryWaitlistResult,
  GetMyClassRedeliveryRequestsResponse,
  GetMyClassRedeliveryRequestsResult,
  GetPendingManagerClassRedeliveryRequestsResponse,
  GetPendingManagerClassRedeliveryRequestsResult,
  OpenRemedialClassResponse,
  OpenRemedialClassResultValue,
  RejectClassRedeliveryRequestResponse,
  RejectClassRedeliveryRequestResult,
  SelectClassRedeliveryRequestResponse,
  SelectClassRedeliveryRequestResult,
  WithdrawClassRedeliveryRequestResponse,
  WithdrawClassRedeliveryRequestResult,
} from "./schemas";

export type {
  ClassRedeliveryCandidate,
  ClassRedeliveryCandidateSession,
  ClassRedeliveryRequest,
  ClassRedeliveryRequestStatus,
  ClassRedeliveryResolutionType,
} from "@/lib/api/entities/class-redelivery-request";

export type {
  OpenRemedialClassResult,
  RedeliveryWaitlistModuleGroup,
  RedeliveryWaitlistProgramGroup,
} from "@/lib/api/entities/redelivery-waitlist";

export type {
  AssignTargetClassRedeliveryRequestInput,
  ClassRedeliveryRequestIdParam,
  CreateClassRedeliveryRequestInput,
  OpenRemedialClassInput,
  RejectClassRedeliveryRequestInput,
  SelectClassRedeliveryRequestInput,
} from "@/lib/validations/class-redelivery-requests";

const REDELIVERY_BASE = "/api/class-redelivery-requests";
const MANAGER_REDELIVERY_BASE = "/api/manager/redelivery";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `POST /api/class-redelivery-requests` */
export const createClassRedeliveryRequest = createApiPost({
  path: REDELIVERY_BASE,
  input: createClassRedeliveryRequestSchema,
  value: classRedeliveryRequestValueSchema,
});

/** `GET /api/class-redelivery-requests/me` */
export async function getMyClassRedeliveryRequests(): Promise<GetMyClassRedeliveryRequestsResult> {
  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/me`,
    getMyClassRedeliveryRequestsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/class-redelivery-requests/pending-manager` */
export async function getPendingManagerClassRedeliveryRequests(): Promise<GetPendingManagerClassRedeliveryRequestsResult> {
  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/pending-manager`,
    getPendingManagerClassRedeliveryRequestsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/class-redelivery-requests/{id}/candidates` */
export async function getClassRedeliveryCandidates(
  id: string,
): Promise<GetClassRedeliveryCandidatesResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/candidates`,
    getClassRedeliveryCandidatesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/class-redelivery-requests/{id}/select-class` */
export async function selectClassRedeliveryRequest(
  id: string,
  input: z.infer<typeof selectClassRedeliveryRequestSchema>,
): Promise<SelectClassRedeliveryRequestResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });
  const body = selectClassRedeliveryRequestSchema.parse(input);

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/select-class`,
    selectClassRedeliveryRequestResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/class-redelivery-requests/{id}/accept-intensive` */
export async function acceptIntensiveClassRedeliveryRequest(
  id: string,
): Promise<AcceptIntensiveClassRedeliveryRequestResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/accept-intensive`,
    acceptIntensiveClassRedeliveryRequestResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/class-redelivery-requests/{id}/decline-intensive` */
export async function declineIntensiveClassRedeliveryRequest(
  id: string,
): Promise<DeclineIntensiveClassRedeliveryRequestResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/decline-intensive`,
    declineIntensiveClassRedeliveryRequestResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/class-redelivery-requests/{id}/withdraw` */
export async function withdrawClassRedeliveryRequest(
  id: string,
): Promise<WithdrawClassRedeliveryRequestResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/withdraw`,
    withdrawClassRedeliveryRequestResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/class-redelivery-requests/{id}/assign-target` */
export async function assignTargetClassRedeliveryRequest(
  id: string,
  input: z.infer<typeof assignTargetClassRedeliveryRequestSchema>,
): Promise<AssignTargetClassRedeliveryRequestResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });
  const body = assignTargetClassRedeliveryRequestSchema.parse(input);

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/assign-target`,
    assignTargetClassRedeliveryRequestResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/class-redelivery-requests/{id}/reject` */
export async function rejectClassRedeliveryRequest(
  id: string,
  input: z.infer<typeof rejectClassRedeliveryRequestSchema> = {},
): Promise<RejectClassRedeliveryRequestResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });
  const body = rejectClassRedeliveryRequestSchema.parse(input);

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/reject`,
    rejectClassRedeliveryRequestResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/manager/redelivery/waitlist` */
export async function getManagerRedeliveryWaitlist(): Promise<GetManagerRedeliveryWaitlistResult> {
  const response = await apiFetchParsed(
    `${MANAGER_REDELIVERY_BASE}/waitlist`,
    getManagerRedeliveryWaitlistResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/manager/redelivery/open-remedial-class` */
export const openRemedialClass = createApiPost({
  path: `${MANAGER_REDELIVERY_BASE}/open-remedial-class`,
  input: openRemedialClassSchema,
  value: openRemedialClassValueSchema,
});
