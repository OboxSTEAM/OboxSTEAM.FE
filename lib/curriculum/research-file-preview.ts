export type ResearchPreviewKind = "image" | "pdf" | "video" | "audio" | "file";

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "m4v"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a"]);

export function getFileExtension(nameOrUrl: string): string {
  const cleaned = nameOrUrl.split("?")[0]?.split("#")[0] ?? nameOrUrl;
  const segment = cleaned.includes("/")
    ? (cleaned.split("/").pop() ?? cleaned)
    : cleaned;
  const parts = segment.split(".");
  if (parts.length < 2) return "";
  return (parts.pop() ?? "").toLowerCase();
}

export function resolveResearchPreviewKind(
  name: string,
  url?: string | null,
): ResearchPreviewKind {
  const ext = getFileExtension(name) || (url ? getFileExtension(url) : "");
  if (IMAGE_EXTS.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (AUDIO_EXTS.has(ext)) return "audio";
  return "file";
}

export function researchFileTypeLabel(kind: ResearchPreviewKind, name: string): string {
  const ext = getFileExtension(name).toUpperCase();
  if (kind === "image") return ext || "Ảnh";
  if (kind === "pdf") return "PDF";
  if (kind === "video") return ext || "Video";
  if (kind === "audio") return ext || "Audio";
  return ext || "Tệp";
}
