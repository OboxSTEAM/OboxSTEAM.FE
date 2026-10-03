import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createSkillFormSchema,
  skillListQuerySchema,
  type CreateSkillFormInput,
  type SkillListQuery,
} from "@/lib/validations/skills";

import {
  createSkillResponseSchema,
  getSkillsResponseSchema,
  type CreatedSkill,
  type GetSkillsResult,
} from "./schemas";

export type {
  CreatedSkill,
  GetSkillsResponse,
  GetSkillsResult,
} from "./schemas";

export type { CreateSkillFormInput, SkillListQuery } from "@/lib/validations/skills";
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

/**
 * `POST /api/skills` — Manager only. Adds a catalog row.
 * Does not attach the skill to a program; callers send `skillIds` on program update.
 */
export async function createSkill(
  input: CreateSkillFormInput,
): Promise<CreatedSkill> {
  const parsed = createSkillFormSchema.parse(input);
  const response = await apiFetchParsed(SKILLS_BASE, createSkillResponseSchema, {
    method: "POST",
    body: {
      code: parsed.code,
      name: parsed.name,
      category: parsed.category,
      subcategory: parsed.subcategory || null,
      description: parsed.description || null,
    },
  });
  assertApiSuccess(response);
  return requireApiValue(response.value).data;
}
