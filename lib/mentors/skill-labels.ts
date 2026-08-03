import type {
  SkillCategory,
  SkillProficiencyLevel,
} from "@/lib/api/entities/mentor";

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  Science: "Science",
  Technology: "Technology",
  Engineering: "Engineering",
  Arts: "Arts",
  Math: "Math",
  SoftSkill: "Soft skill",
};

export const SKILL_PROFICIENCY_LABELS: Record<SkillProficiencyLevel, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  Expert: "Chuyên gia",
};

export const SKILL_PROFICIENCY_OPTIONS = (
  Object.keys(SKILL_PROFICIENCY_LABELS) as SkillProficiencyLevel[]
).map((value) => ({
  value,
  label: SKILL_PROFICIENCY_LABELS[value],
}));
