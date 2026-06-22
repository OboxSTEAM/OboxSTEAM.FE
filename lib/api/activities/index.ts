import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { activityIdParamSchema } from "@/lib/validations/curriculum";

import {
  getActivityByIdResponseSchema,
  type GetActivityByIdResult,
} from "./schemas";

export type {
  GetActivityByIdResponse,
  GetActivityByIdResult,
} from "./schemas";

export type {
  Activity,
  ActivityType,
  CurriculumActivity,
} from "@/lib/api/entities/activity";

export type { ActivityMaterial, CurriculumMaterialSummary } from "@/lib/api/entities/material";

const ACTIVITIES_BASE = "/api/activities";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export async function getActivityById(id: string): Promise<GetActivityByIdResult> {
  const { id: activityId } = activityIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${ACTIVITIES_BASE}/${activityId}`,
    getActivityByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
