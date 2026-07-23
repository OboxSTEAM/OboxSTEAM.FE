import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  classMentorRequestDecisionSchema,
  classMentorRequestIdParamSchema,
  classMentorRequestListQuerySchema,
  createClassMentorRequestSchema,
  mentorBoardQuerySchema,
  myClassMentorRequestListQuerySchema,
  type ClassMentorRequestDecisionInput,
  type ClassMentorRequestListQuery,
  type CreateClassMentorRequestInput,
  type MentorBoardQuery,
  type MyClassMentorRequestListQuery,
} from "@/lib/validations/class-mentor-requests";

import {
  classMentorRequestResponseSchema,
  getClassMentorRequestsResponseSchema,
  getMentorBoardResponseSchema,
  withdrawClassMentorRequestResponseSchema,
  type ClassMentorRequestResult,
  type GetClassMentorRequestsResult,
  type GetMentorBoardResult,
  type WithdrawClassMentorRequestResult,
} from "./schemas";

export type {
  ClassMentorRequestResponse,
  ClassMentorRequestResult,
  GetClassMentorRequestsResponse,
  GetClassMentorRequestsResult,
  GetMentorBoardResponse,
  GetMentorBoardResult,
  MentorBoardClass,
  WithdrawClassMentorRequestResponse,
  WithdrawClassMentorRequestResult,
} from "./schemas";

export type {
  ClassMentorRequest,
  ClassMentorRequestStatus,
} from "@/lib/api/entities/class-mentor-request";

export type {
  ClassMentorRequestDecisionInput,
  ClassMentorRequestListQuery,
  CreateClassMentorRequestInput,
  MentorBoardQuery,
  MyClassMentorRequestListQuery,
} from "@/lib/validations/class-mentor-requests";

const BASE = "/api/class-mentor-requests";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString<T extends Record<string, unknown>>(
  params: T | undefined,
  schema: z.ZodType<T>,
): string {
  if (!params) return "";

  const parsed = schema.parse(params);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** Manager: list class mentor requests with filters. */
export async function getClassMentorRequests(
  params?: ClassMentorRequestListQuery,
): Promise<GetClassMentorRequestsResult> {
  const response = await apiFetchParsed(
    `${BASE}${buildQueryString(params, classMentorRequestListQuerySchema)}`,
    getClassMentorRequestsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Mentor: list own requests. */
export async function getMyClassMentorRequests(
  params?: MyClassMentorRequestListQuery,
): Promise<GetClassMentorRequestsResult> {
  const response = await apiFetchParsed(
    `${BASE}/mine${buildQueryString(params, myClassMentorRequestListQuerySchema)}`,
    getClassMentorRequestsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Mentor: board of Draft/Open classes without a mentor. */
export async function getMentorBoard(
  params?: MentorBoardQuery,
): Promise<GetMentorBoardResult> {
  const response = await apiFetchParsed(
    `${BASE}/board${buildQueryString(params, mentorBoardQuerySchema)}`,
    getMentorBoardResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Mentor: submit a class assignment request. */
export async function createClassMentorRequest(
  input: CreateClassMentorRequestInput,
): Promise<ClassMentorRequestResult> {
  const body = createClassMentorRequestSchema.parse(input);

  const response = await apiFetchParsed(BASE, classMentorRequestResponseSchema, {
    method: "POST",
    body,
  });
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Manager: approve a pending request (assigns mentor to class). */
export async function approveClassMentorRequest(
  id: string,
  input: ClassMentorRequestDecisionInput = {},
): Promise<ClassMentorRequestResult> {
  const { id: parsedId } = classMentorRequestIdParamSchema.parse({ id });
  const body = classMentorRequestDecisionSchema.parse(input);

  const response = await apiFetchParsed(
    `${BASE}/${parsedId}/approve`,
    classMentorRequestResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Manager: reject a pending request. */
export async function rejectClassMentorRequest(
  id: string,
  input: ClassMentorRequestDecisionInput = {},
): Promise<ClassMentorRequestResult> {
  const { id: parsedId } = classMentorRequestIdParamSchema.parse({ id });
  const body = classMentorRequestDecisionSchema.parse(input);

  const response = await apiFetchParsed(
    `${BASE}/${parsedId}/reject`,
    classMentorRequestResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** Mentor: withdraw own pending request. */
export async function withdrawClassMentorRequest(
  id: string,
): Promise<WithdrawClassMentorRequestResult> {
  const { id: parsedId } = classMentorRequestIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${BASE}/${parsedId}`,
    withdrawClassMentorRequestResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
