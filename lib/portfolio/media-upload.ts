/** Client-side limits for `POST /api/portfolios/me/media`. */

export const PORTFOLIO_IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png";
export const PORTFOLIO_VIDEO_ACCEPT = "video/mp4,video/quicktime";
export const PORTFOLIO_MEDIA_ACCEPT = `${PORTFOLIO_IMAGE_ACCEPT},${PORTFOLIO_VIDEO_ACCEPT}`;

export const PORTFOLIO_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Backend allows video uploads under 2 GB. */
export const PORTFOLIO_MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

const IMAGE_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);
const VIDEO_MIME = new Set(["video/mp4", "video/quicktime"]);

export function isPortfolioImageFile(file: File): boolean {
  if (IMAGE_MIME.has(file.type)) return true;
  return /\.(jpe?g|png)$/i.test(file.name);
}

export function isPortfolioVideoFile(file: File): boolean {
  if (VIDEO_MIME.has(file.type)) return true;
  return /\.(mp4|mov)$/i.test(file.name);
}

export type PortfolioMediaValidation =
  | { ok: true; kind: "image" | "video" }
  | { ok: false; message: string };

export function validatePortfolioMediaFile(
  file: File,
  options?: { allowVideo?: boolean },
): PortfolioMediaValidation {
  const allowVideo = options?.allowVideo ?? true;
  const isImage = isPortfolioImageFile(file);
  const isVideo = isPortfolioVideoFile(file);

  if (!isImage && !(allowVideo && isVideo)) {
    return {
      ok: false,
      message: allowVideo
        ? "Chỉ hỗ trợ ảnh JPG/PNG hoặc video MP4/MOV."
        : "Chỉ hỗ trợ ảnh JPG/PNG.",
    };
  }

  if (isImage && file.size > PORTFOLIO_MAX_IMAGE_BYTES) {
    return { ok: false, message: "Ảnh tối đa 5 MB." };
  }

  if (isVideo && file.size > PORTFOLIO_MAX_VIDEO_BYTES) {
    return { ok: false, message: "Video tối đa 2 GB." };
  }

  return { ok: true, kind: isVideo ? "video" : "image" };
}
