import type { Module } from "@/lib/api/entities/module";

/** Parse curriculum snapshot JSON from a review submission. */
export function parseCurriculumSnapshot(
  json: string | null | undefined,
): Module[] | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) return parsed as Module[];
    if (
      parsed &&
      typeof parsed === "object" &&
      "modules" in parsed &&
      Array.isArray((parsed as { modules: unknown }).modules)
    ) {
      return (parsed as { modules: Module[] }).modules;
    }
    return null;
  } catch {
    return null;
  }
}

export type RubricSnapshotCriterion = {
  id: string;
  name: string;
  description?: string;
  evidenceGuidance?: string;
  maxScore: number;
  displayOrder: number;
};

/** Parse rubric snapshot JSON from a review submission. */
export function parseRubricSnapshot(
  json: string | null | undefined,
): RubricSnapshotCriterion[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    const criteria = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          "criteria" in parsed &&
          Array.isArray((parsed as { criteria: unknown }).criteria)
        ? (parsed as { criteria: RubricSnapshotCriterion[] }).criteria
        : [];
    return [...criteria].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    );
  } catch {
    return [];
  }
}
