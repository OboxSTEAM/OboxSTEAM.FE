import { selToQuery, type SelectedNode } from "@/lib/advisory/manager-target";
import type { CurriculumTargetType } from "@/lib/api/advisory-chat/schemas";

/** Location fields needed to open a component; `MentionTarget` satisfies this. */
export type MentionLocation = {
  targetType: CurriculumTargetType;
  targetId: string;
  moduleId?: string | null;
  courseId?: string | null;
  activityId?: string | null;
};

export type MentionNavigation = {
  selection: Exclude<SelectedNode, null>;
  /** Set for Material — the panel opens the parent activity and highlights this row. */
  materialId: string | null;
};

/** Query keys owned by curriculum navigation; replaced on every mention jump. */
const NAVIGATION_PARAM_KEYS = ["tab", "node", "id", "moduleId", "courseId", "material"];

export const MATERIAL_QUERY_PARAM = "material";

/**
 * Map a mentioned component to the split-panel selection. Returns `null` when a
 * required parent id is missing (e.g. the component was deleted).
 */
export function mentionToNavigation(target: MentionLocation): MentionNavigation | null {
  const { targetType, targetId, moduleId, courseId, activityId } = target;

  switch (targetType) {
    case "Program":
      return { selection: { kind: "program" }, materialId: null };
    case "Module":
      return { selection: { kind: "module", id: targetId }, materialId: null };
    case "Course":
      return moduleId
        ? { selection: { kind: "course", id: targetId, moduleId }, materialId: null }
        : null;
    case "Activity":
      return courseId
        ? { selection: { kind: "activity", id: targetId, courseId }, materialId: null }
        : null;
    case "Assignment":
      return moduleId
        ? { selection: { kind: "assignment", id: targetId, moduleId }, materialId: null }
        : null;
    case "ResearchMilestone":
      return moduleId
        ? { selection: { kind: "milestone", id: targetId, moduleId }, materialId: null }
        : null;
    case "Material":
      return activityId && courseId
        ? {
            selection: { kind: "activity", id: activityId, courseId },
            materialId: targetId,
          }
        : null;
    default:
      return null;
  }
}

/**
 * Query string that opens the component on the curriculum tab, keeping unrelated
 * params from `current`. Empty string means the program root.
 */
export function buildMentionQuery(
  navigation: MentionNavigation,
  current?: URLSearchParams | string,
): string {
  const params = new URLSearchParams(current);
  for (const key of NAVIGATION_PARAM_KEYS) params.delete(key);

  for (const [key, value] of new URLSearchParams(selToQuery(navigation.selection))) {
    params.set(key, value);
  }
  if (navigation.materialId) {
    params.set(MATERIAL_QUERY_PARAM, navigation.materialId);
  }
  return params.toString();
}

/** `data-curriculum-anchor` value of the tree row / material row for a component. */
export function curriculumAnchorFor(target: MentionLocation): string {
  switch (target.targetType) {
    case "Program":
      return "program";
    case "Module":
      return `module:${target.targetId}`;
    case "Course":
      return `course:${target.targetId}`;
    case "Activity":
      return `activity:${target.targetId}`;
    case "Assignment":
      return `assignment:${target.targetId}`;
    case "ResearchMilestone":
      return `milestone:${target.targetId}`;
    case "Material":
      return `material:${target.targetId}`;
  }
}

/** Reverse map for tree rows: the component a saved selection points at, if any. */
export function selectionToMentionTarget(
  selection: SelectedNode,
  programId: string,
): { targetType: CurriculumTargetType; targetId: string } | null {
  if (!selection) return null;
  switch (selection.kind) {
    case "program":
      return { targetType: "Program", targetId: programId };
    case "module":
      return { targetType: "Module", targetId: selection.id };
    case "course":
      return { targetType: "Course", targetId: selection.id };
    case "activity":
      return { targetType: "Activity", targetId: selection.id };
    case "assignment":
      return { targetType: "Assignment", targetId: selection.id };
    case "milestone":
      return { targetType: "ResearchMilestone", targetId: selection.id };
    default:
      return null;
  }
}
