import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { createApiPost } from "@/lib/api/create-endpoint";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createActivitySchema,
  activityIdParamSchema,
  updateActivitySchema,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "@/lib/validations/curriculum";
import { activityDetailQuerySchema } from "@/lib/validations/materials";

import {
  createActivityResponseSchema,
  deleteActivityResponseSchema,
  getActivityByIdResponseSchema,
  activityMutationValueSchema,
  updateActivityResponseSchema,
  type CreateActivityResult,
  type DeleteActivityResult,
  type GetActivityByIdResult,
  type UpdateActivityResult,
} from "./schemas";

export type {
  GetActivityByIdResponse,
  GetActivityByIdResult,
  CreateActivityResponse,
  CreateActivityResult,
  UpdateActivityResponse,
  UpdateActivityResult,
  DeleteActivityResponse,
  DeleteActivityResult,
} from "./schemas";

export type {
  Activity,
  ActivityLearningProgress,
  ActivityType,
  CurriculumActivity,
} from "@/lib/api/entities/activity";

export type { ActivityMaterial, CurriculumMaterialSummary } from "@/lib/api/entities/material";

const ACTIVITIES_BASE = "/api/activities";

export type GetActivityByIdOptions = {
  /** Required for students — scopes access to an active enrollment. */
  programEnrollmentId?: string;
};

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildActivityDetailQuery(options?: GetActivityByIdOptions): string {
  if (!options?.programEnrollmentId) {
    return "";
  }

  const { programEnrollmentId } = activityDetailQuerySchema.parse({
    programEnrollmentId: options.programEnrollmentId,
  });

  const searchParams = new URLSearchParams({ programEnrollmentId });
  return `?${searchParams.toString()}`;
}

export async function getActivityById(
  id: string,
  options?: GetActivityByIdOptions,
): Promise<GetActivityByIdResult> {
  const { id: activityId } = activityIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${ACTIVITIES_BASE}/${activityId}${buildActivityDetailQuery(options)}`,
    getActivityByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export const createActivity = createApiPost({
  path: ACTIVITIES_BASE,
  input: createActivitySchema,
  value: activityMutationValueSchema,
});

export async function updateActivity(
  id: string,
  input: UpdateActivityInput,
): Promise<UpdateActivityResult> {
  const { id: activityId } = activityIdParamSchema.parse({ id });
  const body = updateActivitySchema.parse(input);

  const response = await apiFetchParsed(
    `${ACTIVITIES_BASE}/${activityId}`,
    updateActivityResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteActivity(id: string): Promise<DeleteActivityResult> {
  const { id: activityId } = activityIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${ACTIVITIES_BASE}/${activityId}`,
    deleteActivityResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
