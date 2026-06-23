import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  materialByActivityParamsSchema,
  materialByActivityQuerySchema,
} from "@/lib/validations/materials";

import {
  getMaterialByActivityResponseSchema,
  type GetMaterialByActivityResult,
} from "./schemas";

export type {
  GetMaterialByActivityResponse,
  GetMaterialByActivityResult,
} from "./schemas";

export type { Material } from "@/lib/api/entities/material";

const MATERIALS_BASE = "/api/materials";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export async function getMaterialByActivityId(
  activityId: string,
  programEnrollmentId: string,
): Promise<GetMaterialByActivityResult> {
  const { activityId: parsedActivityId } = materialByActivityParamsSchema.parse({
    activityId,
  });
  const { programEnrollmentId: parsedEnrollmentId } =
    materialByActivityQuerySchema.parse({ programEnrollmentId });

  const searchParams = new URLSearchParams({
    programEnrollmentId: parsedEnrollmentId,
  });

  const response = await apiFetchParsed(
    `${MATERIALS_BASE}/activity/${parsedActivityId}?${searchParams.toString()}`,
    getMaterialByActivityResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
