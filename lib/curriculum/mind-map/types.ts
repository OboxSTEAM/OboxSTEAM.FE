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

/** Desktop: modules fan left/right from hub. Mobile: single LTR column tree. */
export type MindMapLayoutMode = "bilateral" | "ltr";

/** Outward growth direction of a node’s branch. */
export type MindMapBranchSide = "left" | "right";

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
  /** Outward branch side relative to the hub. */
  side: MindMapBranchSide;
};

/** Y-split junction between a parent and its fan of children. */
export type MindMapForkJunction = {
  id: string;
  parentId: string;
  childIds: string[];
  x: number;
  y: number;
  isOnCurrentPath: boolean;
  side: MindMapBranchSide;
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
  forks: MindMapForkJunction[];
  bounds: MindMapGraphBounds;
  hubNodeId: string;
  mode: MindMapLayoutMode;
};

export type BuildMindMapGraphOptions = {
  mindMap: EnrollmentCurriculumMindMap;
};

export type LayoutMindMapOptions = {
  mode?: MindMapLayoutMode;
};
