import { getMaterialByActivityId } from "@/lib/api/materials";
import { ApiRequestError, ApiResponseError } from "@/lib/api/errors";

/** Prefer snapshot `url` (signed preview) then `fileUrl` aliases. */
export function pickMaterialPreviewUrl(material: {
  url?: string | null;
  fileUrl?: string | null;
} | null | undefined): string | null {
  if (!material) return null;
  const url = material.url?.trim() || material.fileUrl?.trim() || "";
  return url || null;
}

/**
 * Resolve a fresh signed material preview URL.
 * Board/activity snapshots may already include a signed `url`, but those expire —
 * prefer a live `GET /api/materials/activity/{id}` when possible.
 */
export async function resolveMaterialSignedPreviewUrl(options: {
  activityId: string;
  enrollmentId?: string;
  fallbackUrl?: string | null;
}): Promise<string> {
  const fallback = options.fallbackUrl?.trim() || null;

  try {
    const result = await getMaterialByActivityId(
      options.activityId,
      options.enrollmentId,
    );
    const live = result.data?.fileUrl?.trim() || null;
    if (live) return live;
    if (fallback) return fallback;
    throw new ApiResponseError(
      "Tài liệu chưa có URL xem trước.",
      "MaterialPreviewUnavailable",
    );
  } catch (error) {
    if (fallback && !(error instanceof ApiRequestError && error.status === 403)) {
      return fallback;
    }
    throw error;
  }
}

/** Open a material preview in a new tab using a freshly signed URL. */
export async function openMaterialSignedPreview(options: {
  activityId: string;
  enrollmentId?: string;
  fallbackUrl?: string | null;
}): Promise<void> {
  const url = await resolveMaterialSignedPreviewUrl(options);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    throw new ApiResponseError(
      "Trình duyệt đã chặn cửa sổ xem tài liệu.",
      "MaterialPreviewPopupBlocked",
    );
  }
}

export function isMaterialAccessDenied(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 403;
}
