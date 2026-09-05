import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  classRedeliveryRequestIdParamSchema,
  createClassRedeliveryRequestSchema,
  selectClassRedeliveryRequestSchema,
} from "@/lib/validations/class-redelivery-requests";

import {
  cancelClassRedeliveryRequestResponseSchema,
  classRedeliveryRequestValueSchema,
  getClassRedeliveryCandidatesResponseSchema,
  getMyClassRedeliveryRequestsResponseSchema,
  selectClassRedeliveryRequestResponseSchema,
  type CancelClassRedeliveryRequestResult,
  type GetClassRedeliveryCandidatesResult,
  type GetMyClassRedeliveryRequestsResult,
  type SelectClassRedeliveryRequestResult,
} from "./schemas";

export type {
  CancelClassRedeliveryRequestResponse,
  CancelClassRedeliveryRequestResult,
  CreateClassRedeliveryRequestResponse,
  CreateClassRedeliveryRequestResult,
  GetClassRedeliveryCandidatesResponse,
  GetClassRedeliveryCandidatesResult,
  GetMyClassRedeliveryRequestsResponse,
  GetMyClassRedeliveryRequestsResult,
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
  RebuyClass,
  RebuyClassCatalog,
  RebuyClassCatalogContext,
  RebuyClassModuleProgress,
  RebuyCreditHint,
} from "@/lib/api/entities/rebuy-class-catalog";

export type {
  ClassRedeliveryRequestIdParam,
  CreateClassRedeliveryRequestInput,
  SelectClassRedeliveryRequestInput,
} from "@/lib/validations/class-redelivery-requests";

const REDELIVERY_BASE = "/api/class-redelivery-requests";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `POST /api/class-redelivery-requests` — always creates `AwaitingClassSelection`. */
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

/**
 * `GET /api/class-redelivery-requests/{id}/candidates`
 * Returns shared `RebuyClassCatalogDto` (not the old thin candidate array).
 */
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

/**
 * `POST /api/class-redelivery-requests/{id}/cancel`
 * Cancels the request only — program enrollment stays Active.
 */
export async function cancelClassRedeliveryRequest(
  id: string,
): Promise<CancelClassRedeliveryRequestResult> {
  const { id: requestId } = classRedeliveryRequestIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${REDELIVERY_BASE}/${requestId}/cancel`,
    cancelClassRedeliveryRequestResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/**
 * `POST /api/class-redelivery-requests/{id}/withdraw`
 * @deprecated Prefer `cancelClassRedeliveryRequest` — BE alias of `/cancel`.
 */
export async function withdrawClassRedeliveryRequest(
  id: string,
): Promise<CancelClassRedeliveryRequestResult> {
  return cancelClassRedeliveryRequest(id);
}
