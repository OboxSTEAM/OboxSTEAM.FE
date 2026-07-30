import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  skillListQuerySchema,
  type SkillListQuery,
} from "@/lib/validations/skills";

import {
  getSkillsResponseSchema,
  type GetSkillsResult,
} from "./schemas";

export type {
  GetSkillsResponse,
  GetSkillsResult,
} from "./schemas";

export type { SkillListQuery } from "@/lib/validations/skills";
export type { SkillCategory, SkillSummary } from "@/lib/api/entities/skill";

const SKILLS_BASE = "/api/skills";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString(params?: SkillListQuery): string {
  if (!params) return "";

  const parsed = skillListQuerySchema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/skills` — paged STEAM skill catalog for pickers. */
export async function getSkills(
  params?: SkillListQuery,
): Promise<GetSkillsResult> {
  const response = await apiFetchParsed(
    `${SKILLS_BASE}${buildQueryString(params)}`,
    getSkillsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
