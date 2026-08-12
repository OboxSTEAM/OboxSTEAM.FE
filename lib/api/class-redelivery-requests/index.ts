import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  assignTargetClassRedeliveryRequestSchema,
  classRedeliveryRequestIdParamSchema,
  createClassRedeliveryRequestSchema,
  rejectClassRedeliveryRequestSchema,
} from "@/lib/validations/class-redelivery-requests";

import {
  assignTargetClassRedeliveryRequestResponseSchema,
  classRedeliveryRequestValueSchema,
  getMyClassRedeliveryRequestsResponseSchema,
  getPendingManagerClassRedeliveryRequestsResponseSchema,
  rejectClassRedeliveryRequestResponseSchema,
  withdrawClassRedeliveryRequestResponseSchema,
  type AssignTargetClassRedeliveryRequestResult,
  type GetMyClassRedeliveryRequestsResult,
  type GetPendingManagerClassRedeliveryRequestsResult,
  type RejectClassRedeliveryRequestResult,
  type WithdrawClassRedeliveryRequestResult,
} from "./schemas";

export type {
  AssignTargetClassRedeliveryRequestResponse,
  AssignTargetClassRedeliveryRequestResult,
  CreateClassRedeliveryRequestResponse,
  CreateClassRedeliveryRequestResult,
  GetMyClassRedeliveryRequestsResponse,
  GetMyClassRedeliveryRequestsResult,
  GetPendingManagerClassRedeliveryRequestsResponse,
  GetPendingManagerClassRedeliveryRequestsResult,
  RejectClassRedeliveryRequestResponse,
  RejectClassRedeliveryRequestResult,
  WithdrawClassRedeliveryRequestResponse,
  WithdrawClassRedeliveryRequestResult,
} from "./schemas";

export type {
  ClassRedeliveryRequest,
  ClassRedeliveryRequestStatus,
} from "@/lib/api/entities/class-redelivery-request";

export type {
  AssignTargetClassRedeliveryRequestInput,
  ClassRedeliveryRequestIdParam,
  CreateClassRedeliveryRequestInput,
  RejectClassRedeliveryRequestInput,
} from "@/lib/validations/class-redelivery-requests";

const REDELIVERY_BASE = "/api/class-redelivery-requests";

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
