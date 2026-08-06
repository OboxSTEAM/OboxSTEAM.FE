/** HTML5 DnD MIME types for portfolio gallery import/attach. */

export const CLASS_MEDIA_DRAG_MIME = "application/x-obox-class-media";
export const PORTFOLIO_MEDIA_DRAG_MIME = "application/x-obox-portfolio-media";

export type ClassMediaDragPayload = {
  mediaAssetIds: string[];
};

export type PortfolioMediaDragPayload = {
  assets: Array<{
    id: string;
    url: string | null;
    type: "Image" | "Video";
  }>;
};

export function setClassMediaDragData(
  dataTransfer: DataTransfer,
  payload: ClassMediaDragPayload,
) {
  dataTransfer.setData(CLASS_MEDIA_DRAG_MIME, JSON.stringify(payload));
  dataTransfer.setData("text/plain", payload.mediaAssetIds.join(","));
  dataTransfer.effectAllowed = "copy";
}

export function setPortfolioMediaDragData(
  dataTransfer: DataTransfer,
  payload: PortfolioMediaDragPayload,
) {
  dataTransfer.setData(PORTFOLIO_MEDIA_DRAG_MIME, JSON.stringify(payload));
  dataTransfer.setData(
    "text/plain",
    payload.assets.map((asset) => asset.id).join(","),
  );
  dataTransfer.effectAllowed = "copy";
}

export function readClassMediaDragData(
  dataTransfer: DataTransfer,
): ClassMediaDragPayload | null {
  const raw = dataTransfer.getData(CLASS_MEDIA_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ClassMediaDragPayload;
    if (!Array.isArray(parsed.mediaAssetIds) || parsed.mediaAssetIds.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readPortfolioMediaDragData(
  dataTransfer: DataTransfer,
): PortfolioMediaDragPayload | null {
  const raw = dataTransfer.getData(PORTFOLIO_MEDIA_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PortfolioMediaDragPayload;
    if (!Array.isArray(parsed.assets) || parsed.assets.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasGalleryDragTypes(types: readonly string[]): boolean {
  return (
    types.includes(CLASS_MEDIA_DRAG_MIME) ||
    types.includes(PORTFOLIO_MEDIA_DRAG_MIME)
  );
}
