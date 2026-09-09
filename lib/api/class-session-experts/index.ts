import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  classSessionExpertIdParamSchema,
  classSessionExpertListQuerySchema,
  inviteClassSessionExpertSchema,
  myClassSessionExpertListQuerySchema,
  submitClassSessionExpertFeedbackSchema,
  type ClassSessionExpertListQuery,
  type InviteClassSessionExpertInput,
  type MyClassSessionExpertListQuery,
  type SubmitClassSessionExpertFeedbackInput,
} from "@/lib/validations/class-session-experts";

import {
  classSessionExpertResponseSchema,
  getClassSessionExpertsResponseSchema,
  withdrawClassSessionExpertResponseSchema,
  type ClassSessionExpertResult,
  type GetClassSessionExpertsResult,
  type WithdrawClassSessionExpertResult,
} from "./schemas";

export type {
  ClassSessionExpertResponse,
  ClassSessionExpertResult,
  GetClassSessionExpertsResponse,
  GetClassSessionExpertsResult,
  WithdrawClassSessionExpertResponse,
  WithdrawClassSessionExpertResult,
} from "./schemas";

export type {
  ClassSessionExpert,
  ClassSessionExpertStatus,
} from "@/lib/api/entities/class-session-expert";

export type {
  ClassSessionExpertListQuery,
  InviteClassSessionExpertInput,
  MyClassSessionExpertListQuery,
  SubmitClassSessionExpertFeedbackInput,
} from "@/lib/validations/class-session-experts";

const BASE = "/api/class-session-experts";

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
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getClassSessionExperts(
  params?: ClassSessionExpertListQuery,
): Promise<GetClassSessionExpertsResult> {
  const response = await apiFetchParsed(
    `${BASE}${buildQueryString(params, classSessionExpertListQuerySchema)}`,
    getClassSessionExpertsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getMyClassSessionExperts(
  params?: MyClassSessionExpertListQuery,
): Promise<GetClassSessionExpertsResult> {
  const response = await apiFetchParsed(
    `${BASE}/mine${buildQueryString(params, myClassSessionExpertListQuerySchema)}`,
    getClassSessionExpertsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function getClassSessionExpertById(
  id: string,
): Promise<ClassSessionExpertResult> {
  const { id: inviteId } = classSessionExpertIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${inviteId}`,
    classSessionExpertResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function inviteClassSessionExpert(
  input: InviteClassSessionExpertInput,
): Promise<ClassSessionExpertResult> {
  const body = inviteClassSessionExpertSchema.parse(input);
  const response = await apiFetchParsed(
    BASE,
    classSessionExpertResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function acceptClassSessionExpert(
  id: string,
): Promise<ClassSessionExpertResult> {
  const { id: inviteId } = classSessionExpertIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${inviteId}/accept`,
    classSessionExpertResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function declineClassSessionExpert(
  id: string,
): Promise<ClassSessionExpertResult> {
  const { id: inviteId } = classSessionExpertIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${inviteId}/decline`,
    classSessionExpertResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function withdrawClassSessionExpert(
  id: string,
): Promise<WithdrawClassSessionExpertResult> {
  const { id: inviteId } = classSessionExpertIdParamSchema.parse({ id });
  const response = await apiFetchParsed(
    `${BASE}/${inviteId}/withdraw`,
    withdrawClassSessionExpertResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function submitClassSessionExpertFeedback(
  id: string,
  input: SubmitClassSessionExpertFeedbackInput,
): Promise<ClassSessionExpertResult> {
  const { id: inviteId } = classSessionExpertIdParamSchema.parse({ id });
  const body = submitClassSessionExpertFeedbackSchema.parse(input);
  const response = await apiFetchParsed(
    `${BASE}/${inviteId}/feedback`,
    classSessionExpertResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
