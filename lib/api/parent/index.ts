import { z } from "zod";

import { createApiPost } from "@/lib/api/create-endpoint";
import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  approveParentLinkSchema,
  completeParentProfileSchema,
  parentMagicLoginSchema,
  requestParentLinkSchema,
} from "@/lib/validations/parent";

import {
  getParentLinksResponseSchema,
  parentBooleanValueSchema,
  parentMagicLoginValueSchema,
  type ApproveParentLinkResult,
  type CompleteParentProfileResult,
  type GetParentLinksResult,
  type ParentMagicLoginResult,
  type RequestParentLinkResult,
} from "./schemas";

export type {
  ApproveParentLinkResponse,
  ApproveParentLinkResult,
  CompleteParentProfileResponse,
  CompleteParentProfileResult,
  GetParentLinksResponse,
  GetParentLinksResult,
  ParentLinkedStudent,
  ParentMagicLoginResponse,
  ParentMagicLoginResult,
  RequestParentLinkResponse,
  RequestParentLinkResult,
} from "./schemas";

export type RequestParentLinkInput = z.infer<typeof requestParentLinkSchema>;
export type ParentMagicLoginInput = z.infer<typeof parentMagicLoginSchema>;
export type CompleteParentProfileInput = z.infer<typeof completeParentProfileSchema>;
export type ApproveParentLinkInput = z.infer<typeof approveParentLinkSchema>;

const PARENT_BASE = "/api/parent";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export const requestParentLink = createApiPost({
  path: `${PARENT_BASE}/request-link`,
  input: requestParentLinkSchema,
  value: parentBooleanValueSchema,
});

export const parentMagicLogin = createApiPost({
  path: `${PARENT_BASE}/magic-login`,
  input: parentMagicLoginSchema,
  value: parentMagicLoginValueSchema,
  fetchOptions: { skipAuth: true, skipRefresh: true },
});

export const completeParentProfile = createApiPost({
  path: `${PARENT_BASE}/complete-profile`,
  input: completeParentProfileSchema,
  value: parentBooleanValueSchema,
});

export const approveParentLink = createApiPost({
  path: `${PARENT_BASE}/approve-link`,
  input: approveParentLinkSchema,
  value: parentBooleanValueSchema,
});

export async function getParentLinks(): Promise<GetParentLinksResult> {
  const response = await apiFetchParsed(
    `${PARENT_BASE}/links`,
    getParentLinksResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
