import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiResponseError } from "@/lib/api/errors";
import {
  addMediaTagSchema,
  mediaClassSessionParamSchema,
  mediaIdParamSchema,
  mediaListQuerySchema,
  mediaTagParamsSchema,
  mediaUploadQuerySchema,
  updateMediaTagVerificationSchema,
  type AddMediaTagInput,
  type MediaListQuery,
  type MediaUploadQuery,
  type UpdateMediaTagVerificationInput,
} from "@/lib/validations/media";

import {
  addMediaTagResponseSchema,
  deleteMediaResponseSchema,
  deleteMediaTagResponseSchema,
  getMediaByIdResponseSchema,
  getMediaListResponseSchema,
  processMediaTagsResponseSchema,
  updateMediaTagVerificationResponseSchema,
  uploadMediaResponseSchema,
  type AddMediaTagResult,
  type DeleteMediaResult,
  type DeleteMediaTagResult,
  type GetMediaByIdResult,
  type GetMediaListResult,
  type ProcessMediaTagsResult,
  type UpdateMediaTagVerificationResult,
  type UploadMediaResult,
} from "./schemas";

export type {
  FaceSegment,
  LabelTimelineEntry,
  MediaAsset,
  MediaTag,
  MediaVideoStatus,
} from "@/lib/api/entities/media";

export type {
  AddMediaTagResponse,
  AddMediaTagResult,
  DeleteMediaResponse,
  DeleteMediaResult,
  DeleteMediaTagResponse,
  DeleteMediaTagResult,
  GetMediaByIdResponse,
  GetMediaByIdResult,
  GetMediaListResponse,
  GetMediaListResult,
  ProcessMediaTagsResponse,
  ProcessMediaTagsResult,
  UpdateMediaTagVerificationResponse,
  UpdateMediaTagVerificationResult,
  UploadMediaResponse,
  UploadMediaResult,
} from "./schemas";

export type {
  AddMediaTagInput,
  MediaClassSessionParam,
  MediaIdParam,
  MediaListQuery,
  MediaTagParams,
  MediaUploadQuery,
  UpdateMediaTagVerificationInput,
} from "@/lib/validations/media";

const MEDIA_BASE = "/api/media";

function requireApiValue<T>(value: T | null): T {
  if (value == null) {
    throw new ApiResponseError("Request failed.");
  }
  return value;
}

function buildQueryString<T extends Record<string, unknown>>(
  params: T | undefined,
  schema: z.ZodType<T>,
): string {
  if (!params) return "";

  const parsed = schema.parse(params);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** `GET /api/media` — ready media scoped by class and/or student. */
export async function getMediaList(
  params?: MediaListQuery,
): Promise<GetMediaListResult> {
  const response = await apiFetchParsed(
    `${MEDIA_BASE}${buildQueryString(params, mediaListQuerySchema)}`,
    getMediaListResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/media/{mediaId}` — one asset including face tags. */
export async function getMediaById(mediaId: string): Promise<GetMediaByIdResult> {
  const { mediaId: parsedId } = mediaIdParamSchema.parse({ mediaId });

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/${parsedId}`,
    getMediaByIdResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `GET /api/media/class-session/{classSessionId}`. */
export async function getMediaByClassSession(
  classSessionId: string,
): Promise<GetMediaListResult> {
  const { classSessionId: parsedId } = mediaClassSessionParamSchema.parse({
    classSessionId,
  });

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/class-session/${parsedId}`,
    getMediaListResponseSchema,
    { method: "GET" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/media/upload` — multipart image/video for a class. */
export async function uploadClassMedia(
  file: File,
  query: MediaUploadQuery,
): Promise<UploadMediaResult> {
  const parsed = mediaUploadQuerySchema.parse(query);
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/upload${buildQueryString(parsed, mediaUploadQuerySchema)}`,
    uploadMediaResponseSchema,
    { method: "POST", body: formData },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/media/{mediaId}`. */
export async function deleteMedia(mediaId: string): Promise<DeleteMediaResult> {
  const { mediaId: parsedId } = mediaIdParamSchema.parse({ mediaId });

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/${parsedId}`,
    deleteMediaResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/media/{mediaId}/process-tags` — poll/restart video face tagging. */
export async function processMediaTags(
  mediaId: string,
): Promise<ProcessMediaTagsResult> {
  const { mediaId: parsedId } = mediaIdParamSchema.parse({ mediaId });

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/${parsedId}/process-tags`,
    processMediaTagsResponseSchema,
    { method: "POST" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `POST /api/media/{mediaId}/tags` — manually tag a student. */
export async function addMediaTag(
  mediaId: string,
  input: AddMediaTagInput,
): Promise<AddMediaTagResult> {
  const { mediaId: parsedId } = mediaIdParamSchema.parse({ mediaId });
  const body = addMediaTagSchema.parse(input);

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/${parsedId}/tags`,
    addMediaTagResponseSchema,
    { method: "POST", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `PATCH /api/media/{mediaId}/tags/{studentId}` — verify / unverify. */
export async function updateMediaTagVerification(
  mediaId: string,
  studentId: string,
  input: UpdateMediaTagVerificationInput,
): Promise<UpdateMediaTagVerificationResult> {
  const parsed = mediaTagParamsSchema.parse({ mediaId, studentId });
  const body = updateMediaTagVerificationSchema.parse(input);

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/${parsed.mediaId}/tags/${parsed.studentId}`,
    updateMediaTagVerificationResponseSchema,
    { method: "PATCH", body },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}

/** `DELETE /api/media/{mediaId}/tags/{studentId}`. */
export async function deleteMediaTag(
  mediaId: string,
  studentId: string,
): Promise<DeleteMediaTagResult> {
  const parsed = mediaTagParamsSchema.parse({ mediaId, studentId });

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/${parsed.mediaId}/tags/${parsed.studentId}`,
    deleteMediaTagResponseSchema,
    { method: "DELETE" },
  );
  assertApiSuccess(response);
  return requireApiValue(response.value);
}
