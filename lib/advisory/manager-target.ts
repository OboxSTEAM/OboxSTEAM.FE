import type { AdvisoryThread } from "@/lib/api/entities/program-advisory";

export type SelectedNode =
  | { kind: "program" }
  | { kind: "module-new" }
  | { kind: "module"; id: string }
  | { kind: "course-new"; moduleId: string }
  | { kind: "course"; id: string; moduleId: string }
  | { kind: "activity-new"; courseId: string }
  | { kind: "activity"; id: string; courseId: string }
  | { kind: "assignment-new"; moduleId: string }
  | { kind: "assignment"; id: string; moduleId: string }
  | { kind: "milestone-new"; moduleId: string }
  | { kind: "milestone"; id: string; moduleId: string }
  | null;

export function selToQuery(sel: SelectedNode): string {
  if (!sel || sel.kind === "program") return "";
  const params = new URLSearchParams();
  if (sel.kind === "module-new") {
    params.set("node", "module-new");
  } else if (sel.kind === "module") {
    params.set("node", "module");
    params.set("id", sel.id);
  } else if (sel.kind === "course-new") {
    params.set("node", "course-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "course") {
    params.set("node", "course");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "activity-new") {
    params.set("node", "activity-new");
    params.set("courseId", sel.courseId);
  } else if (sel.kind === "activity") {
    params.set("node", "activity");
    params.set("id", sel.id);
    params.set("courseId", sel.courseId);
  } else if (sel.kind === "assignment-new") {
    params.set("node", "assignment-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "assignment") {
    params.set("node", "assignment");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "milestone-new") {
    params.set("node", "milestone-new");
    params.set("moduleId", sel.moduleId);
  } else if (sel.kind === "milestone") {
    params.set("node", "milestone");
    params.set("id", sel.id);
    params.set("moduleId", sel.moduleId);
  }
  return params.toString();
}

export function threadToSelection(thread: AdvisoryThread): SelectedNode {
  if (thread.type === "General" || !thread.targetExists) return { kind: "program" };
  const path = thread.targetPath;
  switch (thread.targetType) {
    case "Program":
      return { kind: "program" };
    case "Module":
      return thread.targetId ? { kind: "module", id: thread.targetId } : { kind: "program" };
    case "Course":
      return thread.targetId && path?.moduleId
        ? { kind: "course", id: thread.targetId, moduleId: path.moduleId }
        : { kind: "program" };
    case "Activity":
    case "Material": {
      const activityId =
        thread.targetType === "Activity" ? thread.targetId : path?.activityId;
      return activityId && path?.courseId
        ? { kind: "activity", id: activityId, courseId: path.courseId }
        : { kind: "program" };
    }
    case "Assignment":
    case "RubricCriterion": {
      const assignmentId =
        thread.targetType === "Assignment" ? thread.targetId : path?.assignmentId;
      return assignmentId && path?.moduleId
        ? { kind: "assignment", id: assignmentId, moduleId: path.moduleId }
        : { kind: "program" };
    }
    case "ResearchMilestone":
      return thread.targetId && path?.moduleId
        ? { kind: "milestone", id: thread.targetId, moduleId: path.moduleId }
        : { kind: "program" };
    default:
      return { kind: "program" };
  }
}

export function threadMatchesSelection(
  thread: AdvisoryThread,
  sel: SelectedNode,
): boolean {
  if (!sel || sel.kind.endsWith("-new")) return false;
  const mapped = threadToSelection(thread);
  if (!mapped || mapped.kind.endsWith("-new")) return false;
  if (sel.kind === "program") {
    return mapped.kind === "program";
  }
  if (mapped.kind !== sel.kind) return false;
  if (sel.kind === "module" && mapped.kind === "module") return sel.id === mapped.id;
  if (sel.kind === "course" && mapped.kind === "course") {
    return sel.id === mapped.id && sel.moduleId === mapped.moduleId;
  }
  if (sel.kind === "activity" && mapped.kind === "activity") {
    return sel.id === mapped.id && sel.courseId === mapped.courseId;
  }
  if (sel.kind === "assignment" && mapped.kind === "assignment") {
    return sel.id === mapped.id && sel.moduleId === mapped.moduleId;
  }
  if (sel.kind === "milestone" && mapped.kind === "milestone") {
    return sel.id === mapped.id && sel.moduleId === mapped.moduleId;
  }
  return false;
}

export type AdvisoryPinCounts = {
  openRequired: number;
  suggestions: number;
  accepted: boolean;
};

function emptyCounts(): AdvisoryPinCounts {
  return { openRequired: 0, suggestions: 0, accepted: false };
}

function bump(counts: AdvisoryPinCounts, thread: AdvisoryThread) {
  if (thread.type === "General") return;
  if (thread.type === "RequiredChange" && thread.status === "Open") {
    counts.openRequired += 1;
    counts.accepted = false;
    return;
  }
  if (thread.type === "Suggestion" && thread.status !== "Resolved") {
    counts.suggestions += 1;
    return;
  }
}

export function selectionKey(sel: SelectedNode): string {
  if (!sel || sel.kind === "program") return "program";
  if ("id" in sel) return `${sel.kind}:${sel.id}`;
  return sel.kind;
}

/** Counts for a node, including descendants so a collapsed parent still shows work. */
export function buildAdvisoryPinMap(
  threads: AdvisoryThread[],
): Map<string, AdvisoryPinCounts> {
  const map = new Map<string, AdvisoryPinCounts>();
  const touch = (key: string) => {
    const current = map.get(key) ?? emptyCounts();
    map.set(key, current);
    return current;
  };

  for (const thread of threads) {
    if (thread.type === "General") continue;
    const sel = threadToSelection(thread);
    if (!sel || sel.kind === "program" || !("id" in sel)) {
      bump(touch("program"), thread);
      continue;
    }
    bump(touch(`${sel.kind}:${sel.id}`), thread);
    bump(touch("program"), thread);
    if ("moduleId" in sel) bump(touch(`module:${sel.moduleId}`), thread);
    if (sel.kind === "activity") bump(touch(`course:${sel.courseId}`), thread);
  }

  for (const counts of map.values()) {
    counts.accepted = counts.openRequired === 0 && counts.suggestions === 0;
  }
  return map;
}
