import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";

import {
  mentorResponseSchema,
  type MentorResult,
} from "./schemas";

export type {
  DeleteMentorSkillResponse,
  DeleteMentorSkillResult,
  GetMentorsResponse,
  GetMentorsResult,
  GetMyMentorSkillsResponse,
  GetMyMentorSkillsResult,
  MentorResponse,
  MentorResult,
  MentorSkillResponse,
  MentorSkillResult,
} from "./schemas";

export type {
  MentorAssignmentProfile,
  MentorSkill,
  MentorSkillProficiency,
} from "@/lib/api/entities/mentor";

const MENTORS_BASE = "/api/mentors";

const mentorIdParamSchema = z.object({
  id: z.string().uuid("ID mentor không hợp lệ."),
});

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** Manager: mentor profile + skills for assignment decisions. */
export async function getMentorById(id: string): Promise<MentorResult> {
  const { id: parsedId } = mentorIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${MENTORS_BASE}/${parsedId}`,
    mentorResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
