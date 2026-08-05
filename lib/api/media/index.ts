import { z } from "zod";

import { apiFetchParsed, assertApiSuccess } from "@/lib/api/client";
import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";
import {
  addMediaTagSchema,
  classGalleryClassIdParamSchema,
  classGalleryQuerySchema,
  mediaIdParamSchema,
  mediaListQuerySchema,
  mediaTagParamsSchema,
  mediaUploadQuerySchema,
  updateMediaTagVerificationSchema,
  type AddMediaTagInput,
  type ClassGalleryQuery,
  type MediaListQuery,
  type MediaUploadQuery,
  type UpdateMediaTagVerificationInput,
} from "@/lib/validations/media";

import {
  addMediaTagResponseSchema,
  deleteMediaResponseSchema,
  deleteMediaTagResponseSchema,
  getClassGalleryResponseSchema,
  getMediaByIdResponseSchema,
  getMediaListResponseSchema,
  getMediaProgressResponseSchema,
  processMediaTagsResponseSchema,
  updateMediaTagVerificationResponseSchema,
  uploadMediaResponseSchema,
  type AddMediaTagResult,
  type DeleteMediaResult,
  type DeleteMediaTagResult,
  type GetClassGalleryResult,
  type GetMediaByIdResult,
  type GetMediaListResult,
  type GetMediaProgressResult,
  type ProcessMediaTagsResult,
  type UpdateMediaTagVerificationResult,
  type UploadMediaResult,
} from "./schemas";

export type {
  ClassGalleryMedia,
  FaceSegment,
  LabelTimelineEntry,
  MediaAsset,
  MediaProgress,
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
  GetClassGalleryResponse,
  GetClassGalleryResult,
  GetMediaByIdResponse,
  GetMediaByIdResult,
  GetMediaListResponse,
  GetMediaListResult,
  GetMediaProgressResponse,
  GetMediaProgressResult,
  ProcessMediaTagsResponse,
  ProcessMediaTagsResult,
  UpdateMediaTagVerificationResponse,
  UpdateMediaTagVerificationResult,
  UploadMediaResponse,
  UploadMediaResult,
} from "./schemas";

export type {
  AddMediaTagInput,
  ClassGalleryClassIdParam,
  ClassGalleryQuery,
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

/**
 * BE currently throws when the class has no S3 media prefix yet (before first
 * upload). Treat that as an empty list so mentors see upload CTA, not an error.
 */
function isUninitializedMediaStorageError(error: unknown): boolean {
  if (error instanceof ApiResponseError) {
    return (
      error.code === "500" ||
      /unexpected error occurred/i.test(error.message)
    );
  }

  if (error instanceof ApiRequestError && error.status === 500) {
    const body = error.body as
      | { error?: { code?: string; message?: string } }
      | null
      | undefined;
    const code = body?.error?.code;
    const message = body?.error?.message ?? error.message;
    return code === "500" || /unexpected error occurred/i.test(message);
  }

  return false;
}

function emptyMediaListResult(
  pageSize = 50,
): GetMediaListResult {
  return {
    code: "OK",
    message: "Chưa có media.",
    data: {
      items: [],
      currentPage: 1,
      totalPages: 0,
      pageSize,
      totalCount: 0,
      hasPrevious: false,
      hasNext: false,
    },
  };
}

function emptyClassGalleryResult(pageSize = 20): GetClassGalleryResult {
  return {
    code: "OK",
    message: "Chưa có media.",
    data: {
      items: [],
      currentPage: 1,
      totalPages: 0,
      pageSize,
      totalCount: 0,
      hasPrevious: false,
      hasNext: false,
    },
  };
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

/** `GET /api/media` — paginated ready/processing media by class and filters. */
export async function getMediaList(
  params?: MediaListQuery,
): Promise<GetMediaListResult> {
  try {
    const response = await apiFetchParsed(
      `${MEDIA_BASE}${buildQueryString(
        {
          page: 1,
          pageSize: 50,
          isDescending: true,
          ...params,
        },
        mediaListQuerySchema,
      )}`,
      getMediaListResponseSchema,
      { method: "GET" },
    );
    assertApiSuccess(response);
    return requireApiValue(response.value);
  } catch (error) {
    if (isUninitializedMediaStorageError(error)) {
      return emptyMediaListResult();
    }
    throw error;
  }
}

/**
 * `GET /api/media/class/{classId}/gallery` — student class gallery (no face tags).
 * Requires Active enrollment in the class. Includes all video statuses.
 */
export async function getClassGallery(
  classId: string,
  params?: ClassGalleryQuery,
): Promise<GetClassGalleryResult> {
  const { classId: parsedClassId } = classGalleryClassIdParamSchema.parse({
    classId,
  });
  const pageSize = params?.pageSize ?? 20;

  try {
    const response = await apiFetchParsed(
      `${MEDIA_BASE}/class/${parsedClassId}/gallery${buildQueryString(
        {
          page: 1,
          pageSize,
          isDescending: true,
          ...params,
        },
        classGalleryQuerySchema,
      )}`,
      getClassGalleryResponseSchema,
      { method: "GET" },
    );
    assertApiSuccess(response);
    return requireApiValue(response.value);
  } catch (error) {
    if (isUninitializedMediaStorageError(error)) {
      return emptyClassGalleryResult(pageSize);
    }
    throw error;
  }
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

/** `GET /api/media/{mediaId}/progress` — transcode % and pipeline status. */
export async function getMediaProgress(
  mediaId: string,
): Promise<GetMediaProgressResult> {
  const { mediaId: parsedId } = mediaIdParamSchema.parse({ mediaId });

  const response = await apiFetchParsed(
    `${MEDIA_BASE}/${parsedId}/progress`,
    getMediaProgressResponseSchema,
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
