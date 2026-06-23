import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import { activityIdParamSchema } from "@/lib/validations/curriculum";
import { activityDetailQuerySchema } from "@/lib/validations/materials";

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
