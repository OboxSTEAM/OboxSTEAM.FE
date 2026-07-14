import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  materialByActivityParamsSchema,
  materialIdParamSchema,
  updateMaterialSchema,
  type UpdateMaterialInput,
} from "@/lib/validations/materials";

import {
  deleteMaterialResponseSchema,
  getMaterialResponseSchema,
  uploadMaterialResponseSchema,
  updateMaterialResponseSchema,
  type DeleteMaterialResult,
  type GetMaterialResult,
  type UploadMaterialResult,
  type UpdateMaterialResult,
} from "./schemas";

export type {
  GetMaterialResponse,
  GetMaterialResult,
  UploadMaterialResponse,
  UploadMaterialResult,
  UpdateMaterialResponse,
  UpdateMaterialResult,
  DeleteMaterialResponse,
  DeleteMaterialResult,
} from "./schemas";

export type { Material, MaterialType, ActivityMaterial, CurriculumMaterialSummary } from "@/lib/api/entities/material";

const MATERIALS_BASE = "/api/materials";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

export async function getMaterialByActivityId(
  activityId: string,
  programEnrollmentId?: string,
): Promise<GetMaterialResult> {
  const { activityId: id } = materialByActivityParamsSchema.parse({ activityId });

  const query = programEnrollmentId ? `?programEnrollmentId=${programEnrollmentId}` : "";

  const response = await apiFetchParsed(
    `${MATERIALS_BASE}/activity/${id}${query}`,
    getMaterialResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function uploadMaterial(
  activityId: string,
  title: string,
  file: File,
): Promise<UploadMaterialResult> {
  const formData = new FormData();
  formData.append("file", file);

  const searchParams = new URLSearchParams({
    activityId,
    title,
  });

  const response = await apiFetchParsed(
    `${MATERIALS_BASE}/upload?${searchParams.toString()}`,
    uploadMaterialResponseSchema,
    {
      method: "POST",
      body: formData,
    },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function updateMaterial(
  id: string,
  input: UpdateMaterialInput,
): Promise<UpdateMaterialResult> {
  const { id: materialId } = materialIdParamSchema.parse({ id });
  const body = updateMaterialSchema.parse(input);

  const response = await apiFetchParsed(
    `${MATERIALS_BASE}/${materialId}`,
    updateMaterialResponseSchema,
    { method: "PUT", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

export async function deleteMaterial(id: string): Promise<DeleteMaterialResult> {
  const { id: materialId } = materialIdParamSchema.parse({ id });

  const response = await apiFetchParsed(
    `${MATERIALS_BASE}/${materialId}`,
    deleteMaterialResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
