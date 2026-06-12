import type { ProgramExpert } from "@/lib/api/entities/expert";
import type { Program } from "@/lib/api/entities/program";

import { PROGRAM_LEVEL_LABELS } from "./constants";

export function parseProgramSkills(skillsGained: string): string[] {
  return skillsGained
    .split(/[,;•\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function formatProgramSkillsPreview(skillsGained: string): string {
  return parseProgramSkills(skillsGained).join(", ");
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

export function getProgramExpertId(
  expert: Pick<ProgramExpert, "expertId"> & { id?: string | null },
): string | null {
  return expert.expertId || expert.id || null;
}

export function formatProgramExpertSummary(experts: ProgramExpert[]): string | null {
  if (experts.length === 0) return null;

  const first = experts[0].fullName;
  const rest = experts.length - 1;

  if (rest === 0) return `Giảng viên: ${first}`;
  return `Giảng viên: ${first} +${rest}`;
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
    program.seriesName,
    program.estimatedDuration,
  ].join(" · ");
}
