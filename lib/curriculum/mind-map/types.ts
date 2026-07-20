import type {
  EnrollmentCurriculumMindMap,
  MindMapActivity,
  MindMapAssignment,
  MindMapChildProgress,
  MindMapContainerLearning,
  MindMapCourse,
  MindMapHub,
  MindMapMilestone,
  MindMapModule,
  MindMapModuleLearning,
  MindMapNavigation,
  MindMapNodeStatus,
} from "@/lib/api";

export type MindMapNodeKind =
  | "program"
  | "module"
  | "course"
  | "milestone"
  | "activity"
  | "assignment";

export type MindMapGraphNode = {
  id: string;
  kind: MindMapNodeKind;
  parentId: string | null;
  label: string;
  order: number;
  status: MindMapNodeStatus | null;
  isLocked: boolean;
  lockReason: string | null;
  progressPercent: number | null;
  childProgress: MindMapChildProgress | null;
  isOnCurrentPath: boolean;
  isExpandable: boolean;
  navigation: MindMapNavigation | null;
  /** Source payload references for the inspector. */
  hub?: MindMapHub;
  module?: MindMapModule;
  course?: MindMapCourse;
  milestone?: MindMapMilestone;
  activity?: MindMapActivity;
  assignment?: MindMapAssignment;
  moduleLearning?: MindMapModuleLearning;
  containerLearning?: MindMapContainerLearning;
};

export type MindMapGraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  isOnCurrentPath: boolean;
};

export type MindMapLaidOutNode = MindMapGraphNode & {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  angle: number;
};

export type MindMapGraphBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type MindMapGraphModel = {
  enrollmentId: string;
  hub: MindMapHub;
  nodes: MindMapGraphNode[];
  edges: MindMapGraphEdge[];
  currentPathNodeIds: Set<string>;
  /** Module ids that contain at least one current-path node. */
  currentPathModuleIds: Set<string>;
};

export type MindMapLayoutResult = {
  nodes: MindMapLaidOutNode[];
  edges: MindMapGraphEdge[];
  bounds: MindMapGraphBounds;
  hubNodeId: string;
};

export type BuildMindMapGraphOptions = {
  mindMap: EnrollmentCurriculumMindMap;
};
