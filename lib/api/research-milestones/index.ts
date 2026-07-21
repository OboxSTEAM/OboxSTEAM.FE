import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createResearchMilestoneSchema,
  linkMilestoneActivitySchema,
  milestoneIdParamSchema,
  milestoneModuleParamSchema,
  updateResearchMilestoneSchema,
  type CreateResearchMilestoneInput,
  type LinkMilestoneActivityInput,
  type UpdateResearchMilestoneInput,
} from "@/lib/validations/research-milestones";

import {
  deleteResearchMilestoneResponseSchema,
  getResearchMilestoneResponseSchema,
  getResearchMilestonesResponseSchema,
  linkMilestoneActivityResponseSchema,
  researchMilestoneMutationResponseSchema,
  type GetResearchMilestoneResult,
  type GetResearchMilestonesResult,
  type LinkMilestoneActivityResult,
  type ResearchMilestoneMutationResult,
} from "./schemas";

export type {
  GetResearchMilestoneResponse,
  GetResearchMilestoneResult,
  GetResearchMilestonesResponse,
  GetResearchMilestonesResult,
  LinkMilestoneActivityResponse,
  LinkMilestoneActivityResult,
  ResearchMilestoneMutationResponse,
  ResearchMilestoneMutationResult,
} from "./schemas";

export type {
  MilestoneAssignment,
  ResearchMilestone,
  ResearchMilestoneActivity,
} from "@/lib/api/entities/research-milestone";

export type {
  CreateResearchMilestoneInput,
  LinkMilestoneActivityInput,
  UpdateResearchMilestoneInput,
} from "@/lib/validations/research-milestones";

const MODULES_BASE = "/api/modules";
const MILESTONES_BASE = "/api/research-milestones";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

/** `GET /api/modules/{moduleId}/research-milestones` — list milestones for a module. */
export async function getResearchMilestonesByModule(
  moduleId: string,
): Promise<GetResearchMilestonesResult> {
  const { moduleId: id } = milestoneModuleParamSchema.parse({ moduleId });

  const response = await apiFetchParsed(
    `${MODULES_BASE}/${id}/research-milestones`,
    getResearchMilestonesResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/modules/{moduleId}/research-milestones` — create a milestone + deliverable assignment. */
export async function createResearchMilestone(
  moduleId: string,
  input: CreateResearchMilestoneInput,
): Promise<ResearchMilestoneMutationResult> {
  const { moduleId: id } = milestoneModuleParamSchema.parse({ moduleId });
  const body = createResearchMilestoneSchema.parse(input);

  const response = await apiFetchParsed(
    `${MODULES_BASE}/${id}/research-milestones`,
    researchMilestoneMutationResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/research-milestones/{milestoneId}`. */
export async function getResearchMilestoneById(
  milestoneId: string,
): Promise<GetResearchMilestoneResult> {
  const { milestoneId: id } = milestoneIdParamSchema.parse({ milestoneId });

  const response = await apiFetchParsed(
    `${MILESTONES_BASE}/${id}`,
    getResearchMilestoneResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PUT /api/research-milestones/{milestoneId}`. */
export async function updateResearchMilestone(
  milestoneId: string,
  input: UpdateResearchMilestoneInput,
): Promise<ResearchMilestoneMutationResult> {
  const { milestoneId: id } = milestoneIdParamSchema.parse({ milestoneId });
  const body = updateResearchMilestoneSchema.parse(input);

  const response = await apiFetchParsed(
    `${MILESTONES_BASE}/${id}`,
    researchMilestoneMutationResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/research-milestones/{milestoneId}` — soft-delete milestone + assignment. */
export async function deleteResearchMilestone(milestoneId: string): Promise<void> {
  const { milestoneId: id } = milestoneIdParamSchema.parse({ milestoneId });

  const response = await apiFetchParsed(
    `${MILESTONES_BASE}/${id}`,
    deleteResearchMilestoneResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
}

/** `POST /api/research-milestones/{milestoneId}/activities` — link an activity. */
export async function linkMilestoneActivity(
  milestoneId: string,
  input: LinkMilestoneActivityInput,
): Promise<LinkMilestoneActivityResult> {
  const { milestoneId: id } = milestoneIdParamSchema.parse({ milestoneId });
  const body = linkMilestoneActivitySchema.parse(input);

  const response = await apiFetchParsed(
    `${MILESTONES_BASE}/${id}/activities`,
    linkMilestoneActivityResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/research-milestones/{milestoneId}/activities/{activityId}` — unlink an activity. */
export async function unlinkMilestoneActivity(
  milestoneId: string,
  activityId: string,
): Promise<void> {
  const { milestoneId: id } = milestoneIdParamSchema.parse({ milestoneId });

  const response = await apiFetchParsed(
    `${MILESTONES_BASE}/${id}/activities/${activityId}`,
    deleteResearchMilestoneResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
}
