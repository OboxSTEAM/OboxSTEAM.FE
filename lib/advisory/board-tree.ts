import type {
  ActivitySnapshot,
  AdvisoryBoard,
  AdvisoryTargetType,
  AssignmentSnapshot,
  CourseSnapshot,
  FrameworkHighlight,
  MilestoneSnapshot,
  ModuleSnapshot,
  ProgramSnapshot,
  SubmissionChangeItem,
  SubmissionChanges,
} from "@/lib/api/entities/program-advisory";

export type BoardNodeKind =
  | "program"
  | "module"
  | "course"
  | "activity"
  | "assignment"
  | "milestone";

export type BoardChangeKind = "added" | "removed" | "modified" | "reordered";

export type BoardTreeNode = {
  key: string;
  kind: BoardNodeKind;
  targetType: AdvisoryTargetType;
  targetId: string;
  label: string;
  meta: string;
  depth: number;
  change?: BoardChangeKind;
  program?: ProgramSnapshot | null;
  module?: ModuleSnapshot;
  course?: CourseSnapshot;
  activity?: ActivitySnapshot;
  assignment?: AssignmentSnapshot;
  milestone?: MilestoneSnapshot;
};

function resolveActivityType(activity: ActivitySnapshot): string {
  return activity.activityType || activity.type || "SelfPaced";
}

function resolveModuleType(mod: ModuleSnapshot): string {
  return mod.moduleType || mod.type || "Theory";
}

function emptyModuleStub(id: string, label: string): ModuleSnapshot {
  return {
    id,
    code: null,
    name: label,
    order: 0,
    type: null,
    moduleType: null,
    prerequisiteModuleId: null,
    isMandatory: true,
    learningOutcomes: [],
    courses: [],
    activities: [],
    materials: [],
    assignments: [],
    milestones: [],
  };
}

/** Prefer course-nested activities; fall back to module-level by courseId. */
export function resolveCourseActivities(
  mod: ModuleSnapshot,
  course: CourseSnapshot,
): ActivitySnapshot[] {
  if (course.activities.length > 0) {
    return [...course.activities].sort((a, b) => a.order - b.order);
  }
  return mod.activities
    .filter((activity) => activity.courseId === course.id)
    .sort((a, b) => a.order - b.order);
}

export function buildChangeIndex(
  changes: SubmissionChanges | null | undefined,
): Map<string, BoardChangeKind> {
  const map = new Map<string, BoardChangeKind>();
  if (!changes) return map;

  const apply = (items: SubmissionChangeItem[], kind: BoardChangeKind) => {
    for (const item of items) {
      const key = `${item.targetType}:${item.id}`;
      // Prefer structural kinds over modified when both exist.
      const existing = map.get(key);
      if (!existing || existing === "modified") {
        map.set(key, kind);
      }
    }
  };

  apply(changes.modified, "modified");
  apply(changes.reordered, "reordered");
  apply(changes.added, "added");
  apply(changes.removed, "removed");
  return map;
}

export function buildFieldChangesForTarget(
  changes: SubmissionChanges | null | undefined,
  targetType: AdvisoryTargetType,
  targetId: string,
): SubmissionChangeItem[] {
  if (!changes) return [];
  return changes.modified.filter(
    (item) => item.targetType === targetType && item.id === targetId,
  );
}

export function buildBoardTree(
  board: AdvisoryBoard,
  options?: { includeRemovedGhosts?: boolean },
): BoardTreeNode[] {
  const changeIndex = buildChangeIndex(board.changeSummary);
  const includeRemoved = options?.includeRemovedGhosts ?? true;
  const nodes: BoardTreeNode[] = [];
  const seenActivityIds = new Set<string>();

  const programSnapshot =
    board.curriculum.program ??
    ({
      id: board.program.id,
      name: board.program.name,
      code: board.program.code,
      description: board.program.description,
      descriptionIsTruncated: false,
      skillsGained: board.program.skillsGained,
      frameworkVersionId: board.program.frameworkVersionId,
    } satisfies ProgramSnapshot);

  const programChange = changeIndex.get(`Program:${board.program.id}`);
  nodes.push({
    key: `Program:${board.program.id}`,
    kind: "program",
    targetType: "Program",
    targetId: board.program.id,
    label: programSnapshot.name || board.curriculum.programName || "Chương trình",
    meta: [programSnapshot.code, `${board.curriculum.modules.length} học phần`]
      .filter(Boolean)
      .join(" · "),
    depth: 0,
    change: programChange,
    program: programSnapshot,
  });

  const modules = [...board.curriculum.modules].sort(
    (left, right) => left.order - right.order,
  );

  for (const mod of modules) {
    const moduleChange = changeIndex.get(`Module:${mod.id}`);
    nodes.push({
      key: `Module:${mod.id}`,
      kind: "module",
      targetType: "Module",
      targetId: mod.id,
      label: mod.name || "Học phần",
      meta: [
        resolveModuleType(mod),
        mod.isMandatory ? "bắt buộc" : "tùy chọn",
        `${mod.courses.length} khóa`,
      ].join(" · "),
      depth: 1,
      change: moduleChange,
      module: mod,
    });

    const courses = [...mod.courses].sort((a, b) => a.order - b.order);
    for (const course of courses) {
      const activities = resolveCourseActivities(mod, course);
      const courseChange = changeIndex.get(`Course:${course.id}`);
      nodes.push({
        key: `Course:${course.id}`,
        kind: "course",
        targetType: "Course",
        targetId: course.id,
        label: course.name || "Khóa học",
        meta: [course.code, `${activities.length} hoạt động`]
          .filter(Boolean)
          .join(" · "),
        depth: 2,
        change: courseChange,
        module: mod,
        course,
      });

      for (const activity of activities) {
        seenActivityIds.add(activity.id);
        const activityChange = changeIndex.get(`Activity:${activity.id}`);
        const materialLabel =
          activity.material?.title ||
          activity.material?.fileName ||
          activity.material?.materialType ||
          activity.material?.type;
        nodes.push({
          key: `Activity:${activity.id}`,
          kind: "activity",
          targetType: "Activity",
          targetId: activity.id,
          label: activity.name || "Hoạt động",
          meta: [
            resolveActivityType(activity),
            activity.durationMinutes != null
              ? `${activity.durationMinutes} phút`
              : null,
            materialLabel,
          ]
            .filter(Boolean)
            .join(" · "),
          depth: 3,
          change: activityChange,
          module: mod,
          course,
          activity,
        });
      }
    }

    // Legacy module-level activities not linked to a course.
    const orphanActivities = mod.activities
      .filter((activity) => !seenActivityIds.has(activity.id))
      .sort((a, b) => a.order - b.order);
    for (const activity of orphanActivities) {
      seenActivityIds.add(activity.id);
      nodes.push({
        key: `Activity:${activity.id}`,
        kind: "activity",
        targetType: "Activity",
        targetId: activity.id,
        label: activity.name || "Hoạt động",
        meta: [resolveActivityType(activity), "legacy"].join(" · "),
        depth: 2,
        change: changeIndex.get(`Activity:${activity.id}`),
        module: mod,
        activity,
      });
    }

    for (const assignment of [...mod.assignments].sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    )) {
      nodes.push({
        key: `Assignment:${assignment.id}`,
        kind: "assignment",
        targetType: "Assignment",
        targetId: assignment.id,
        label: assignment.title || "Bài tập",
        meta: [
          assignment.assignmentType,
          assignment.passScore != null ? `Pass ≥ ${assignment.passScore}` : null,
          `max ${assignment.maxPoints}`,
        ]
          .filter(Boolean)
          .join(" · "),
        depth: 2,
        change: changeIndex.get(`Assignment:${assignment.id}`),
        module: mod,
        assignment,
      });
    }

    for (const milestone of [...mod.milestones].sort(
      (a, b) => a.order - b.order,
    )) {
      nodes.push({
        key: `ResearchMilestone:${milestone.id}`,
        kind: "milestone",
        targetType: "ResearchMilestone",
        targetId: milestone.id,
        label: milestone.title || "Mốc nghiên cứu",
        meta: [
          milestone.isCapstone ? "Capstone" : "Milestone",
          milestone.assignment?.title,
        ]
          .filter(Boolean)
          .join(" · "),
        depth: 2,
        change: changeIndex.get(`ResearchMilestone:${milestone.id}`),
        module: mod,
        milestone,
      });
    }
  }

  if (includeRemoved && board.changeSummary) {
    const existing = new Set(nodes.map((node) => node.key));
    for (const item of board.changeSummary.removed) {
      const key = `${item.targetType}:${item.id}`;
      if (existing.has(key)) continue;
      const kind = targetTypeToKind(item.targetType);
      if (!kind) continue;
      nodes.push({
        key,
        kind,
        targetType: item.targetType,
        targetId: item.id,
        label: item.label || item.targetType,
        meta: "Đã gỡ khỏi lần nộp này",
        depth:
          kind === "program"
            ? 0
            : kind === "module"
              ? 1
              : kind === "activity"
                ? 3
                : 2,
        change: "removed",
        module:
          kind === "program"
            ? undefined
            : emptyModuleStub(item.id, item.label || ""),
        program:
          kind === "program"
            ? {
                id: item.id,
                name: item.label || "",
                code: "",
                description: "",
                descriptionIsTruncated: false,
                skillsGained: "",
                frameworkVersionId: null,
              }
            : undefined,
      });
    }
  }

  return nodes;
}

function targetTypeToKind(
  targetType: AdvisoryTargetType,
): BoardNodeKind | null {
  switch (targetType) {
    case "Program":
      return "program";
    case "Module":
      return "module";
    case "Course":
      return "course";
    case "Activity":
      return "activity";
    case "Assignment":
      return "assignment";
    case "ResearchMilestone":
      return "milestone";
    default:
      return null;
  }
}

export function pinSummaryKey(
  targetType: AdvisoryTargetType,
  targetId: string | null,
): string {
  return `${targetType}:${targetId ?? "program"}`;
}

export function frameworkFailKeys(
  highlights: FrameworkHighlight[],
): Set<string> {
  return new Set(
    highlights
      .filter((item) => !item.passed)
      .map((item) => `${item.targetType}:${item.targetId}`),
  );
}

export function programFrameworkFails(
  highlights: FrameworkHighlight[],
  programId: string,
): FrameworkHighlight[] {
  return highlights.filter(
    (item) =>
      !item.passed &&
      item.targetType === "Program" &&
      item.targetId === programId,
  );
}

export type NestedBoardNode = BoardTreeNode & { children: NestedBoardNode[] };

/** Nest a depth-ordered flat board tree into a hierarchical structure tree. */
export function nestBoardTree(flat: BoardTreeNode[]): NestedBoardNode[] {
  const roots: NestedBoardNode[] = [];
  const stack: NestedBoardNode[] = [];

  for (const node of flat) {
    const nested: NestedBoardNode = { ...node, children: [] };
    while (stack.length > 0 && stack[stack.length - 1]!.depth >= node.depth) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    if (!parent) {
      roots.push(nested);
    } else {
      parent.children.push(nested);
    }
    stack.push(nested);
  }

  return roots;
}
