import { parseApiDateTime } from "@/lib/api/datetime";
import type { ProgramExpert } from "@/lib/api/entities/expert";
import type { Program } from "@/lib/api/entities/program";

import { PROGRAM_LEVEL_LABELS } from "./constants";

const REVIEW_DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Formats review timestamps; accepts ISO and legacy `dd/MM/yyyy HH:mm:ss`. */
export function formatReviewDate(value: string | null | undefined): string {
  const date = parseApiDateTime(value);
  if (!date) return value ?? "";
  return REVIEW_DATE_FORMATTER.format(date);
}

/** True when the review was edited after creation (BE sets `updatedAt` on edit). */
export function isReviewEdited(review: {
  createdAt: string;
  updatedAt: string | null;
}): boolean {
  if (!review.updatedAt) return false;
  const created = parseApiDateTime(review.createdAt);
  const updated = parseApiDateTime(review.updatedAt);
  if (!created || !updated) return false;
  return updated.getTime() - created.getTime() > 1000;
}

/** Display names for catalog skills linked to a program, skipping blanks. */
export function formatCatalogSkillNames(
  skills: ReadonlyArray<{ name?: string | null; code?: string | null }>,
): string {
  return skills
    .map((skill) => skill.name?.trim() || skill.code?.trim() || "")
    .filter(Boolean)
    .join(", ");
}

export type ProgramCardExpert = {
  name: string;
  avatarUrl: string | null;
  initials: string;
};

export function getExpertInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function getExpertAvatarUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/** Default mock thumbnail when a program has no image (placehold.co style). */
export const PROGRAM_THUMBNAIL_PLACEHOLDER_URL =
  "https://placehold.co/800x450/png";

/** Usable thumbnail URL — falls back to the placehold.co mock when missing/invalid. */
export function getProgramThumbnailUrl(
  url: string | null | undefined,
): string {
  if (!url?.trim()) return PROGRAM_THUMBNAIL_PLACEHOLDER_URL;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return PROGRAM_THUMBNAIL_PLACEHOLDER_URL;
  } catch {
    return PROGRAM_THUMBNAIL_PLACEHOLDER_URL;
  }
}

export function getProgramExpertId(
  expert: Pick<ProgramExpert, "expertId"> & { id?: string | null },
): string | null {
  return expert.expertId || expert.id || null;
}

export function formatProgramExpertSummary(experts: ProgramExpert[]): string | null {
  if (experts.length === 0) return null;

  const first = experts[0].fullName;
  const rest = experts.length - 1;

  if (rest === 0) return `Chuyên gia: ${first}`;
  return "Chuyên gia";
}

export function truncateProgramDescription(
  description: string,
  maxLength = 160,
): string {
  const trimmed = description.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const end = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;

  return `${slice.slice(0, end).trim()}…`;
}

/** First linked expert for compact card display (avatar + name). */
export function getProgramCardExpert(
  program: Program,
): ProgramCardExpert | null {
  const expert = program.experts[0];
  if (!expert) return null;

  return {
    name: expert.fullName,
    avatarUrl: getExpertAvatarUrl(expert.avatarUrl),
    initials: getExpertInitials(expert.fullName),
  };
}

export function formatProgramCardFooterMeta(program: Program): string {
  return [
    PROGRAM_LEVEL_LABELS[program.level],
    program.seriesName || null,
    program.estimatedDuration || null,
  ]
    .filter(Boolean)
    .join(" · ");
}
