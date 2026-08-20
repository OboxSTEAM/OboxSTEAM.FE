/** Shared image/video detection for gallery thumbs and lightboxes. */

export function isImageFile(
  fileType: string | null | undefined,
  url?: string | null,
): boolean {
  const type = (fileType ?? "").toLowerCase();
  if (
    type.includes("image") ||
    type === "jpg" ||
    type === "jpeg" ||
    type === "png" ||
    type === "webp" ||
    type === "image"
  ) {
    return true;
  }
  const href = (url ?? "").toLowerCase();
  return (
    href.endsWith(".jpg") ||
    href.endsWith(".jpeg") ||
    href.endsWith(".png") ||
    href.endsWith(".webp")
  );
}

export function isVideoFile(
  fileType: string | null | undefined,
  url?: string | null,
): boolean {
  const type = (fileType ?? "").toLowerCase();
  if (
    type.includes("video") ||
    type === "mp4" ||
    type === "mov" ||
    type === "quicktime" ||
    type === "video"
  ) {
    return true;
  }
  const href = (url ?? "").toLowerCase();
  return href.endsWith(".mp4") || href.endsWith(".mov") || href.endsWith(".webm");
}
