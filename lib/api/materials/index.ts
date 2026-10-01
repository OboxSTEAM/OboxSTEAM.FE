import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  createMaterialFromAttachmentSchema,
  materialByActivityParamsSchema,
  materialIdParamSchema,
  materialListQuerySchema,
  updateMaterialSchema,
  type CreateMaterialFromAttachmentInput,
  type MaterialListQuery,
  type UpdateMaterialInput,
} from "@/lib/validations/materials";

import {
  deleteMaterialResponseSchema,
  getMaterialResponseSchema,
  getMaterialsResponseSchema,
  uploadMaterialResponseSchema,
  updateMaterialResponseSchema,
  type DeleteMaterialResult,
  type GetMaterialResult,
  type GetMaterialsResult,
  type UploadMaterialResult,
  type UpdateMaterialResult,
} from "./schemas";

export type {
  GetMaterialsResponse,
  GetMaterialsResult,
  GetMaterialResponse,
  GetMaterialResult,
  UploadMaterialResponse,
  UploadMaterialResult,
  UpdateMaterialResponse,
  UpdateMaterialResult,
  DeleteMaterialResponse,
  DeleteMaterialResult,
} from "./schemas";

export type {
  Material,
  MaterialType,
  MaterialListItem,
  ActivityMaterial,
  CurriculumMaterialSummary,
} from "@/lib/api/entities/material";
export type { MaterialListQuery, MaterialTypeFilter } from "@/lib/validations/materials";

const MATERIALS_BASE = "/api/materials";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildMaterialListQuery(params?: MaterialListQuery): string {
  if (!params) return "";
  const parsed = materialListQuerySchema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/materials` — paginated list with program/course/activity context. */
export async function getMaterials(
  params?: MaterialListQuery,
): Promise<GetMaterialsResult> {
  const response = await apiFetchParsed(
    `${MATERIALS_BASE}${buildMaterialListQuery(params)}`,
    getMaterialsResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
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

/**
 * `POST /api/materials/from-discussion-attachment` — copies a chat attachment into a
 * SelfPaced activity that has no material yet (409 `MATERIAL_ACTIVITY_INVALID` otherwise).
 */
export async function createMaterialFromDiscussionAttachment(
  input: CreateMaterialFromAttachmentInput,
): Promise<UploadMaterialResult> {
  const body = createMaterialFromAttachmentSchema.parse(input);

  const response = await apiFetchParsed(
    `${MATERIALS_BASE}/from-discussion-attachment`,
    uploadMaterialResponseSchema,
    { method: "POST", body },
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
