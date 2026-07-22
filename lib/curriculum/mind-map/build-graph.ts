import type {
  EnrollmentCurriculumMindMap,
  MindMapActivity,
  MindMapAssignment,
  MindMapCourse,
  MindMapMilestone,
  MindMapModule,
} from "@/lib/api";

import type {
  BuildMindMapGraphOptions,
  MindMapGraphEdge,
  MindMapGraphModel,
  MindMapGraphNode,
} from "./types";

function nodeKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}

function pushEdge(
  edges: MindMapGraphEdge[],
  sourceId: string,
  targetId: string,
  currentPathNodeIds: Set<string>,
) {
  edges.push({
    id: `${sourceId}->${targetId}`,
    sourceId,
    targetId,
    isOnCurrentPath:
      currentPathNodeIds.has(sourceId) && currentPathNodeIds.has(targetId),
  });
}

function collectCurrentPathIds(mindMap: EnrollmentCurriculumMindMap): {
  currentPathNodeIds: Set<string>;
  currentPathModuleIds: Set<string>;
} {
  const currentPathNodeIds = new Set<string>();
  const currentPathModuleIds = new Set<string>();

  for (const path of mindMap.currentPaths ?? []) {
    for (const node of path.nodes ?? []) {
      if (!node.nodeType || !node.nodeId) continue;
      const key = nodeKey(node.nodeType, node.nodeId);
      currentPathNodeIds.add(key);
      if (node.nodeType === "module") {
        currentPathModuleIds.add(node.nodeId);
      }
    }
  }

  return { currentPathNodeIds, currentPathModuleIds };
}

function mapActivityNode(
  activity: MindMapActivity,
  parentId: string,
  currentPathNodeIds: Set<string>,
): MindMapGraphNode {
  const id = nodeKey("activity", activity.activityInfo.activityId);
  return {
    id,
    kind: "activity",
    parentId,
    label: activity.activityInfo.activityName?.trim() || "Hoạt động",
    order: activity.activityInfo.activityOrder,
    status: activity.learning.status,
    isLocked: activity.learning.isLocked,
    lockReason: activity.learning.lockReason,
    progressPercent: null,
    childProgress: null,
    isOnCurrentPath: currentPathNodeIds.has(id),
    isExpandable: false,
    navigation: activity.navigation,
    activity,
  };
}

function mapAssignmentNode(
  assignment: MindMapAssignment,
  parentId: string,
  currentPathNodeIds: Set<string>,
): MindMapGraphNode {
  const id = nodeKey("assignment", assignment.assignmentInfo.assignmentId);
  return {
    id,
    kind: "assignment",
    parentId,
    label:
      assignment.assignmentInfo.title?.trim() ||
      assignment.assignmentInfo.assignmentCode?.trim() ||
      "Bài tập",
    order: 0,
    status: assignment.learning.status,
    isLocked: assignment.learning.isLocked,
    lockReason: assignment.learning.lockReason,
    progressPercent: null,
    childProgress: null,
    isOnCurrentPath: currentPathNodeIds.has(id),
    isExpandable: false,
    navigation: assignment.navigation,
    assignment,
  };
}

function mapCourseSubtree(
  course: MindMapCourse,
  moduleNodeId: string,
  currentPathNodeIds: Set<string>,
  nodes: MindMapGraphNode[],
  edges: MindMapGraphEdge[],
) {
  const courseId = nodeKey("course", course.courseInfo.courseId);
  const hasChildren =
    (course.activities?.length ?? 0) > 0 || (course.assignments?.length ?? 0) > 0;

  nodes.push({
    id: courseId,
    kind: "course",
    parentId: moduleNodeId,
    label: course.courseInfo.courseName?.trim() || "Khóa học",
    order: course.courseInfo.courseOrder,
    status: course.learning.status,
    isLocked: course.learning.isLocked,
    lockReason: course.learning.lockReason,
    progressPercent: course.learning.progressPercent,
    childProgress: course.childProgress,
    isOnCurrentPath: currentPathNodeIds.has(courseId),
    isExpandable: hasChildren,
    navigation: course.navigation,
    course,
    containerLearning: course.learning,
  });
  pushEdge(edges, moduleNodeId, courseId, currentPathNodeIds);

  const activities = [...(course.activities ?? [])].sort(
    (left, right) =>
      left.activityInfo.activityOrder - right.activityInfo.activityOrder,
  );
  for (const activity of activities) {
    const activityNode = mapActivityNode(activity, courseId, currentPathNodeIds);
    nodes.push(activityNode);
    pushEdge(edges, courseId, activityNode.id, currentPathNodeIds);
  }

  for (const assignment of course.assignments ?? []) {
    const assignmentNode = mapAssignmentNode(
      assignment,
      courseId,
      currentPathNodeIds,
    );
    nodes.push(assignmentNode);
    pushEdge(edges, courseId, assignmentNode.id, currentPathNodeIds);
  }
}

function mapMilestoneSubtree(
  milestone: MindMapMilestone,
  moduleNodeId: string,
  currentPathNodeIds: Set<string>,
  nodes: MindMapGraphNode[],
  edges: MindMapGraphEdge[],
) {
  const milestoneId = nodeKey("milestone", milestone.milestoneInfo.milestoneId);
  const hasChildren =
    (milestone.activities?.length ?? 0) > 0 || Boolean(milestone.assignment);

  nodes.push({
    id: milestoneId,
    kind: "milestone",
    parentId: moduleNodeId,
    label: milestone.milestoneInfo.milestoneName?.trim() || "Mốc",
    order: milestone.milestoneInfo.milestoneOrder,
    status: milestone.learning.status,
    isLocked: milestone.learning.isLocked,
    lockReason: milestone.learning.lockReason,
    progressPercent: milestone.learning.progressPercent,
    childProgress: milestone.childProgress,
    isOnCurrentPath: currentPathNodeIds.has(milestoneId),
    isExpandable: hasChildren,
    navigation: milestone.navigation,
    milestone,
    containerLearning: milestone.learning,
  });
  pushEdge(edges, moduleNodeId, milestoneId, currentPathNodeIds);

  const activities = [...(milestone.activities ?? [])].sort(
    (left, right) =>
      left.activityInfo.activityOrder - right.activityInfo.activityOrder,
  );
  for (const activity of activities) {
    const activityNode = mapActivityNode(activity, milestoneId, currentPathNodeIds);
    nodes.push(activityNode);
    pushEdge(edges, milestoneId, activityNode.id, currentPathNodeIds);
  }

  if (milestone.assignment) {
    const assignmentNode = mapAssignmentNode(
      milestone.assignment,
      milestoneId,
      currentPathNodeIds,
    );
    nodes.push(assignmentNode);
    pushEdge(edges, milestoneId, assignmentNode.id, currentPathNodeIds);
  }
}

function mapModuleSubtree(
  moduleNode: MindMapModule,
  hubNodeId: string,
  currentPathNodeIds: Set<string>,
  nodes: MindMapGraphNode[],
  edges: MindMapGraphEdge[],
) {
  const moduleId = nodeKey("module", moduleNode.moduleInfo.moduleId);
  const hasChildren =
    (moduleNode.courses?.length ?? 0) > 0 ||
    (moduleNode.milestones?.length ?? 0) > 0 ||
    (moduleNode.assignments?.length ?? 0) > 0;

  nodes.push({
    id: moduleId,
    kind: "module",
    parentId: hubNodeId,
    label: moduleNode.moduleInfo.moduleName?.trim() || "Mô-đun",
    order: moduleNode.moduleInfo.moduleOrder,
    status: moduleNode.learning.status,
    isLocked: moduleNode.learning.isLocked,
    lockReason: moduleNode.learning.lockReason,
    progressPercent: moduleNode.learning.progressPercent,
    childProgress: moduleNode.childProgress,
    isOnCurrentPath: currentPathNodeIds.has(moduleId),
    isExpandable: hasChildren,
    navigation: moduleNode.navigation,
    module: moduleNode,
    moduleLearning: moduleNode.learning,
  });
  pushEdge(edges, hubNodeId, moduleId, currentPathNodeIds);

  const courses = [...(moduleNode.courses ?? [])].sort(
    (left, right) => left.courseInfo.courseOrder - right.courseInfo.courseOrder,
  );
  for (const course of courses) {
    mapCourseSubtree(course, moduleId, currentPathNodeIds, nodes, edges);
  }

  const milestones = [...(moduleNode.milestones ?? [])].sort(
    (left, right) =>
      left.milestoneInfo.milestoneOrder - right.milestoneInfo.milestoneOrder,
  );
  for (const milestone of milestones) {
    mapMilestoneSubtree(milestone, moduleId, currentPathNodeIds, nodes, edges);
  }

  for (const assignment of moduleNode.assignments ?? []) {
    const assignmentNode = mapAssignmentNode(
      assignment,
      moduleId,
      currentPathNodeIds,
    );
    nodes.push(assignmentNode);
    pushEdge(edges, moduleId, assignmentNode.id, currentPathNodeIds);
  }
}

/** Normalize mind-map API payload into a flat graph of nodes and edges. */
export function buildMindMapGraph({
  mindMap,
}: BuildMindMapGraphOptions): MindMapGraphModel {
  const { currentPathNodeIds, currentPathModuleIds } =
    collectCurrentPathIds(mindMap);

  const hubNodeId = nodeKey("program", mindMap.hub.programId);
  currentPathNodeIds.add(hubNodeId);

  const nodes: MindMapGraphNode[] = [
    {
      id: hubNodeId,
      kind: "program",
      parentId: null,
      label: mindMap.hub.programName?.trim() || "Chương trình",
      order: 0,
      status: mindMap.hub.status,
      isLocked: false,
      lockReason: null,
      progressPercent: mindMap.hub.progressPercent,
      childProgress: {
        totalCount: mindMap.hub.totalModuleCount,
        completedCount: mindMap.hub.completedModuleCount,
        progressPercent: mindMap.hub.progressPercent,
      },
      isOnCurrentPath: true,
      isExpandable: (mindMap.modules?.length ?? 0) > 0,
      navigation: mindMap.hub.navigation,
      hub: mindMap.hub,
    },
  ];
  const edges: MindMapGraphEdge[] = [];

  const modules = [...(mindMap.modules ?? [])].sort(
    (left, right) => left.moduleInfo.moduleOrder - right.moduleInfo.moduleOrder,
  );

  for (const moduleItem of modules) {
    mapModuleSubtree(moduleItem, hubNodeId, currentPathNodeIds, nodes, edges);
    if (
      currentPathNodeIds.has(nodeKey("module", moduleItem.moduleInfo.moduleId))
    ) {
      currentPathModuleIds.add(moduleItem.moduleInfo.moduleId);
    }
  }

  // Mark module ids that have any descendant on the current path.
  for (const node of nodes) {
    if (!node.isOnCurrentPath || !node.parentId) continue;
    let cursor: MindMapGraphNode | undefined = nodes.find(
      (item) => item.id === node.parentId,
    );
    while (cursor) {
      if (cursor.kind === "module" && cursor.module) {
        currentPathModuleIds.add(cursor.module.moduleInfo.moduleId);
      }
      cursor = cursor.parentId
        ? nodes.find((item) => item.id === cursor!.parentId)
        : undefined;
    }
  }

  return {
    enrollmentId: mindMap.enrollmentId,
    hub: mindMap.hub,
    nodes,
    edges,
    currentPathNodeIds,
    currentPathModuleIds,
  };
}

/** Default expanded set: hub + modules on current path (or first unlocked module). */
export function getInitialExpandedIds(model: MindMapGraphModel): Set<string> {
  const expanded = new Set<string>();
  const hub = model.nodes.find((node) => node.kind === "program");
  if (hub) expanded.add(hub.id);

  const pathModules = model.nodes.filter(
    (node) =>
      node.kind === "module" &&
      node.module &&
      model.currentPathModuleIds.has(node.module.moduleInfo.moduleId),
  );

  const modulesToExpand =
    pathModules.length > 0
      ? pathModules
      : model.nodes
          .filter((node) => node.kind === "module" && !node.isLocked)
          .slice(0, 1);

  for (const moduleNode of modulesToExpand) {
    expanded.add(moduleNode.id);
    for (const child of model.nodes) {
      if (child.parentId === moduleNode.id && child.isExpandable) {
        if (child.isOnCurrentPath || modulesToExpand.length === 1) {
          expanded.add(child.id);
        }
      }
    }
  }

  return expanded;
}
