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

/** Placeholder until program list API exposes expert fields. */
export function getProgramCardExpert(_program: Program): ProgramCardExpert {
  return {
    name: "Chuyên gia STEAM",
    avatarUrl: null,
    initials: "ST",
  };
}

export function formatProgramCardFooterMeta(program: Program): string {
  return [
    PROGRAM_LEVEL_LABELS[program.level],
    program.seriesName,
    program.estimatedDuration,
  ].join(" · ");
}
