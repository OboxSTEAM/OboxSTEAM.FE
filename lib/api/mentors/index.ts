import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  addMentorSkillSchema,
  mentorIdParamSchema,
  mentorListQuerySchema,
  mentorSkillIdParamSchema,
  updateMentorClassLimitSchema,
  updateMentorProfileSchema,
} from "@/lib/validations/mentors";

import {
  addMyMentorSkillResponseSchema,
  deleteMyMentorSkillResponseSchema,
  getMentorByIdResponseSchema,
  getMentorsResponseSchema,
  getMyMentorProfileResponseSchema,
  getMyMentorSkillsResponseSchema,
  updateMentorClassLimitResponseSchema,
  updateMyMentorProfileResponseSchema,
  type AddMyMentorSkillResult,
  type DeleteMyMentorSkillResult,
  type GetMentorByIdResult,
  type GetMentorsResult,
  type GetMyMentorProfileResult,
  type GetMyMentorSkillsResult,
  type UpdateMentorClassLimitResult,
  type UpdateMyMentorProfileResult,
} from "./schemas";

export type {
  ClassMentorSummary,
  Mentor,
  MentorAssignmentProfile,
  MentorRole,
  MentorSkill,
  MentorSkillInfo,
  MentorSkillProficiency,
  MentorStatus,
  SkillCategory,
  SkillProficiencyLevel,
} from "@/lib/api/entities/mentor";

export type {
  AddMyMentorSkillResponse,
  AddMyMentorSkillResult,
  DeleteMyMentorSkillResponse,
  DeleteMyMentorSkillResult,
  GetMentorByIdResponse,
  GetMentorByIdResult,
  GetMentorsResponse,
  GetMentorsResult,
  GetMyMentorProfileResponse,
  GetMyMentorProfileResult,
  GetMyMentorSkillsResponse,
  GetMyMentorSkillsResult,
  UpdateMentorClassLimitResponse,
  UpdateMentorClassLimitResult,
  UpdateMyMentorProfileResponse,
  UpdateMyMentorProfileResult,
} from "./schemas";

/** Aliases for manager callers that used the older naming. */
export type MentorResponse = import("./schemas").GetMentorByIdResponse;
export type MentorResult = import("./schemas").GetMentorByIdResult;

export type {
  AddMentorSkillInput,
  MentorIdParam,
  MentorListQuery,
  MentorSkillIdParam,
  UpdateMentorClassLimitInput,
  UpdateMentorProfileInput,
} from "@/lib/validations/mentors";

import type {
  AddMentorSkillInput,
  MentorListQuery,
  UpdateMentorClassLimitInput,
  UpdateMentorProfileInput,
} from "@/lib/validations/mentors";

const MENTORS_BASE = "/api/mentors";
const MENTORS_ME = `${MENTORS_BASE}/me`;

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
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/mentors` — list mentors with skills and concurrent usage. */
export async function getMentors(
  params?: MentorListQuery,
): Promise<GetMentorsResult> {
  const response = await apiFetchParsed(
    `${MENTORS_BASE}${buildQueryString(params, mentorListQuerySchema)}`,
    getMentorsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/mentors/{id}` — mentor profile for assignment / class display. */
export async function getMentorById(
  mentorId: string,
): Promise<GetMentorByIdResult> {
  const { mentorId: parsedMentorId } = mentorIdParamSchema.parse({ mentorId });

  const response = await apiFetchParsed(
    `${MENTORS_BASE}/${parsedMentorId}`,
    getMentorByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/mentors/me/profile` — current user's mentor public profile. */
export async function getMyMentorProfile(): Promise<GetMyMentorProfileResult> {
  const response = await apiFetchParsed(
    `${MENTORS_ME}/profile`,
    getMyMentorProfileResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/mentors/me/profile` — partial mentor public fields. */
export async function updateMyMentorProfile(
  input: UpdateMentorProfileInput,
): Promise<UpdateMyMentorProfileResult> {
  const body = updateMentorProfileSchema.parse(input);
  const response = await apiFetchParsed(
    `${MENTORS_ME}/profile`,
    updateMyMentorProfileResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/mentors/me/skills` — skills on the current mentor profile. */
export async function getMyMentorSkills(): Promise<GetMyMentorSkillsResult> {
  const response = await apiFetchParsed(
    `${MENTORS_ME}/skills`,
    getMyMentorSkillsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/mentors/me/skills` — add a skill to the current mentor. */
export async function addMyMentorSkill(
  input: AddMentorSkillInput,
): Promise<AddMyMentorSkillResult> {
  const body = addMentorSkillSchema.parse(input);
  const response = await apiFetchParsed(
    `${MENTORS_ME}/skills`,
    addMyMentorSkillResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/mentors/me/skills/{id}` — remove a mentor skill link. */
export async function deleteMyMentorSkill(
  mentorSkillId: string,
): Promise<DeleteMyMentorSkillResult> {
  const { mentorSkillId: parsedId } = mentorSkillIdParamSchema.parse({
    mentorSkillId,
  });

  const response = await apiFetchParsed(
    `${MENTORS_ME}/skills/${parsedId}`,
    deleteMyMentorSkillResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/mentors/{id}/class-limit` — set concurrent class capacity. */
export async function updateMentorClassLimit(
  mentorId: string,
  input: UpdateMentorClassLimitInput,
): Promise<UpdateMentorClassLimitResult> {
  const { mentorId: parsedMentorId } = mentorIdParamSchema.parse({ mentorId });
  const body = updateMentorClassLimitSchema.parse(input);

  const response = await apiFetchParsed(
    `${MENTORS_BASE}/${parsedMentorId}/class-limit`,
    updateMentorClassLimitResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
