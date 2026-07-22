import type {
  LayoutMindMapOptions,
  MindMapBranchSide,
  MindMapForkJunction,
  MindMapGraphBounds,
  MindMapGraphEdge,
  MindMapGraphModel,
  MindMapGraphNode,
  MindMapLaidOutNode,
  MindMapLayoutMode,
  MindMapLayoutResult,
  MindMapNodeKind,
} from "./types";

const NODE_SIZE: Record<MindMapNodeKind, { width: number; height: number }> = {
  program: { width: 112, height: 112 },
  module: { width: 148, height: 84 },
  course: { width: 148, height: 40 },
  milestone: { width: 148, height: 40 },
  activity: { width: 156, height: 36 },
  assignment: { width: 156, height: 36 },
};

/** Horizontal gap between parent edge and child edge. */
const COL_GAP = {
  hubToModule: 72,
  moduleToContainer: 64,
  containerToLeaf: 56,
} as const;

/** Vertical gap between sibling subtree bands. */
const SIBLING_GAP = 20;
const MODULE_STACK_GAP = 36;
const BOUNDS_PAD = 96;

function emptyBounds(): MindMapGraphBounds {
  return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
}

/** Circular hub size — grows slightly with label length, stays square. */
export function measureHubSize(label: string): { width: number; height: number } {
  const chars = label.trim().length;
  const size = Math.min(156, Math.max(104, 88 + Math.ceil(chars / 8) * 8));
  return { width: size, height: size };
}

function nodeSize(node: MindMapGraphNode): { width: number; height: number } {
  if (node.kind === "program") return measureHubSize(node.label);
  return NODE_SIZE[node.kind];
}

function computeBounds(
  nodes: MindMapLaidOutNode[],
  forks: MindMapForkJunction[],
): MindMapGraphBounds {
  if (nodes.length === 0) return emptyBounds();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const halfW = node.width / 2;
    const halfH = node.height / 2;
    minX = Math.min(minX, node.x - halfW);
    minY = Math.min(minY, node.y - halfH);
    maxX = Math.max(maxX, node.x + halfW);
    maxY = Math.max(maxY, node.y + halfH);
  }

  for (const fork of forks) {
    minX = Math.min(minX, fork.x);
    minY = Math.min(minY, fork.y);
    maxX = Math.max(maxX, fork.x);
    maxY = Math.max(maxY, fork.y);
  }

  return {
    minX: minX - BOUNDS_PAD,
    minY: minY - BOUNDS_PAD,
    maxX: maxX + BOUNDS_PAD,
    maxY: maxY + BOUNDS_PAD,
    width: maxX - minX + BOUNDS_PAD * 2,
    height: maxY - minY + BOUNDS_PAD * 2,
  };
}

function childrenOf(
  nodes: MindMapGraphNode[],
  parentId: string,
): MindMapGraphNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort(
      (left, right) =>
        left.order - right.order || left.label.localeCompare(right.label),
    );
}

function isVisible(
  node: MindMapGraphNode,
  expandedIds: Set<string>,
  nodeById: Map<string, MindMapGraphNode>,
): boolean {
  if (!node.parentId) return true;

  let parent = nodeById.get(node.parentId);
  while (parent) {
    if (parent.isExpandable && !expandedIds.has(parent.id)) {
      return false;
    }
    if (!parent.parentId) break;
    parent = nodeById.get(parent.parentId);
  }
  return true;
}

function colGapFor(parentKind: MindMapNodeKind): number {
  if (parentKind === "program") return COL_GAP.hubToModule;
  if (parentKind === "module") return COL_GAP.moduleToContainer;
  return COL_GAP.containerToLeaf;
}

/**
 * Subtree height reserved for a node and all currently-visible descendants.
 * Ensures neighboring branches never collide when activities expand.
 */
function measureSubtreeHeight(
  node: MindMapGraphNode,
  visibleNodes: MindMapGraphNode[],
  expandedIds: Set<string>,
): number {
  const self = nodeSize(node).height;

  if (!node.isExpandable || !expandedIds.has(node.id)) {
    return self;
  }

  const kids = childrenOf(visibleNodes, node.id);
  if (kids.length === 0) return self;

  const kidsTotal =
    kids.reduce(
      (sum, child) => sum + measureSubtreeHeight(child, visibleNodes, expandedIds),
      0,
    ) +
    (kids.length - 1) * SIBLING_GAP;

  return Math.max(self, kidsTotal);
}

function distributeBandCenters(
  count: number,
  heights: number[],
  bandCenterY: number,
  gap: number,
): number[] {
  if (count === 0) return [];
  const total =
    heights.reduce((sum, h) => sum + h, 0) + Math.max(0, count - 1) * gap;
  let cursor = bandCenterY - total / 2;
  return heights.map((height) => {
    const center = cursor + height / 2;
    cursor += height + gap;
    return center;
  });
}

function placeSubtree(options: {
  node: MindMapGraphNode;
  centerX: number;
  centerY: number;
  side: MindMapBranchSide;
  depth: number;
  visibleNodes: MindMapGraphNode[];
  expandedIds: Set<string>;
  laidOut: MindMapLaidOutNode[];
  forks: MindMapForkJunction[];
}) {
  const {
    node,
    centerX,
    centerY,
    side,
    depth,
    visibleNodes,
    expandedIds,
    laidOut,
    forks,
  } = options;

  const size = nodeSize(node);
  laidOut.push({
    ...node,
    x: centerX,
    y: centerY,
    width: size.width,
    height: size.height,
    depth,
    side,
  });

  if (!node.isExpandable || !expandedIds.has(node.id)) return;

  const kids = childrenOf(visibleNodes, node.id);
  if (kids.length === 0) return;

  const dir = side === "right" ? 1 : -1;
  const kidHeights = kids.map((child) =>
    measureSubtreeHeight(child, visibleNodes, expandedIds),
  );
  const kidCenters = distributeBandCenters(
    kids.length,
    kidHeights,
    centerY,
    SIBLING_GAP,
  );

  const gap = colGapFor(node.kind);
  const junctionX = centerX + dir * (size.width / 2 + gap * 0.42);

  if (kids.length > 1) {
    forks.push({
      id: `fork:${node.id}`,
      parentId: node.id,
      childIds: kids.map((child) => child.id),
      x: junctionX,
      y: centerY,
      isOnCurrentPath:
        node.isOnCurrentPath || kids.some((child) => child.isOnCurrentPath),
      side,
    });
  }

  kids.forEach((child, index) => {
    const childSize = nodeSize(child);
    const childCenterX =
      centerX + dir * (size.width / 2 + gap + childSize.width / 2);
    placeSubtree({
      node: child,
      centerX: childCenterX,
      centerY: kidCenters[index]!,
      side,
      depth: depth + 1,
      visibleNodes,
      expandedIds,
      laidOut,
      forks,
    });
  });
}

function assignModuleSides(
  modules: MindMapGraphNode[],
  mode: MindMapLayoutMode,
): Array<{ module: MindMapGraphNode; side: MindMapBranchSide }> {
  if (mode === "ltr") {
    return modules.map((module) => ({ module, side: "right" as const }));
  }

  const mid = Math.ceil(modules.length / 2);
  return modules.map((module, index) => ({
    module,
    side: (index < mid ? "right" : "left") as MindMapBranchSide,
  }));
}

function stackModulesOnSide(options: {
  modules: MindMapGraphNode[];
  side: MindMapBranchSide;
  hub: MindMapGraphNode;
  hubSize: { width: number; height: number };
  visibleNodes: MindMapGraphNode[];
  expandedIds: Set<string>;
  laidOut: MindMapLaidOutNode[];
  forks: MindMapForkJunction[];
  mode: MindMapLayoutMode;
}) {
  const {
    modules,
    side,
    hub,
    hubSize,
    visibleNodes,
    expandedIds,
    laidOut,
    forks,
    mode,
  } = options;

  if (modules.length === 0) return;

  const heights = modules.map((module) =>
    measureSubtreeHeight(module, visibleNodes, expandedIds),
  );
  const centers = distributeBandCenters(
    modules.length,
    heights,
    0,
    MODULE_STACK_GAP,
  );

  const dir = side === "right" ? 1 : -1;
  const moduleW = NODE_SIZE.module.width;
  const moduleCenterX =
    mode === "ltr"
      ? hubSize.width / 2 + COL_GAP.hubToModule + moduleW / 2
      : dir * (hubSize.width / 2 + COL_GAP.hubToModule + moduleW / 2);

  if (modules.length > 1) {
    forks.push({
      id: `fork:${hub.id}:${side}`,
      parentId: hub.id,
      childIds: modules.map((module) => module.id),
      x: dir * (hubSize.width / 2 + COL_GAP.hubToModule * 0.4),
      y: 0,
      isOnCurrentPath:
        hub.isOnCurrentPath ||
        modules.some((module) => module.isOnCurrentPath),
      side,
    });
  }

  modules.forEach((module, index) => {
    placeSubtree({
      node: module,
      centerX: moduleCenterX,
      centerY: centers[index]!,
      side,
      depth: 1,
      visibleNodes,
      expandedIds,
      laidOut,
      forks,
    });
  });
}

/**
 * Subtree-aware bilateral (desktop) or LTR (mobile) mind-map layout.
 * Neighboring expanded branches reserve vertical bands so activity nodes
 * never merge.
 */
export function layoutMindMap(
  model: MindMapGraphModel,
  expandedIds: Set<string>,
  options: LayoutMindMapOptions = {},
): MindMapLayoutResult {
  const mode: MindMapLayoutMode = options.mode ?? "bilateral";
  const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
  const visibleNodes = model.nodes.filter((node) =>
    isVisible(node, expandedIds, nodeById),
  );
  const visibleIds = new Set(visibleNodes.map((node) => node.id));

  const hub = visibleNodes.find((node) => node.kind === "program");
  if (!hub) {
    return {
      nodes: [],
      edges: [],
      forks: [],
      bounds: emptyBounds(),
      hubNodeId: "",
      mode,
    };
  }

  const laidOut: MindMapLaidOutNode[] = [];
  const forks: MindMapForkJunction[] = [];
  const hubSize = measureHubSize(hub.label);

  laidOut.push({
    ...hub,
    x: 0,
    y: 0,
    width: hubSize.width,
    height: hubSize.height,
    depth: 0,
    side: "right",
  });

  const modules = childrenOf(visibleNodes, hub.id);
  const assigned = assignModuleSides(modules, mode);

  if (mode === "ltr") {
    stackModulesOnSide({
      modules: assigned.map((item) => item.module),
      side: "right",
      hub,
      hubSize,
      visibleNodes,
      expandedIds,
      laidOut,
      forks,
      mode,
    });
  } else {
    const rightModules = assigned
      .filter((item) => item.side === "right")
      .map((item) => item.module);
    const leftModules = assigned
      .filter((item) => item.side === "left")
      .map((item) => item.module);

    stackModulesOnSide({
      modules: rightModules,
      side: "right",
      hub,
      hubSize,
      visibleNodes,
      expandedIds,
      laidOut,
      forks,
      mode,
    });
    stackModulesOnSide({
      modules: leftModules,
      side: "left",
      hub,
      hubSize,
      visibleNodes,
      expandedIds,
      laidOut,
      forks,
      mode,
    });
  }

  // Single-child hub→module edges still need a fork-free direct path;
  // when only one module on a side, no fork was created — direct edges handle it.

  const edges: MindMapGraphEdge[] = model.edges.filter(
    (edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId),
  );

  return {
    nodes: laidOut,
    edges,
    forks,
    bounds: computeBounds(laidOut, forks),
    hubNodeId: hub.id,
    mode,
  };
}

export function fitTransform(
  bounds: MindMapGraphBounds,
  viewportWidth: number,
  viewportHeight: number,
  padding = 48,
): { x: number; y: number; scale: number } {
  if (bounds.width <= 0 || bounds.height <= 0 || viewportWidth <= 0) {
    return { x: viewportWidth / 2, y: viewportHeight / 2, scale: 1 };
  }

  const availableW = Math.max(viewportWidth - padding * 2, 120);
  const availableH = Math.max(viewportHeight - padding * 2, 120);
  const scale = Math.min(
    1.05,
    Math.max(0.28, Math.min(availableW / bounds.width, availableH / bounds.height)),
  );

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    x: viewportWidth / 2 - centerX * scale,
    y: viewportHeight / 2 - centerY * scale,
    scale,
  };
}

export function focusTransform(
  node: MindMapLaidOutNode,
  viewportWidth: number,
  viewportHeight: number,
  scale = 1,
): { x: number; y: number; scale: number } {
  return {
    x: viewportWidth / 2 - node.x * scale,
    y: viewportHeight / 2 - node.y * scale,
    scale,
  };
}

/**
 * Keep a node at the same screen position after a layout change
 * (e.g. expand/collapse) without resetting zoom.
 */
export function preserveNodeScreenPosition(
  prevNode: { x: number; y: number },
  nextNode: { x: number; y: number },
  viewport: { x: number; y: number; scale: number },
): { x: number; y: number; scale: number } {
  const screenX = viewport.x + prevNode.x * viewport.scale;
  const screenY = viewport.y + prevNode.y * viewport.scale;
  return {
    scale: viewport.scale,
    x: screenX - nextNode.x * viewport.scale,
    y: screenY - nextNode.y * viewport.scale,
  };
}

/** Soft branch accents — used only on connectors / thin borders. */
export const MIND_MAP_BRANCH_COLORS = [
  "#5BA3C9",
  "#7A9E55",
  "#C9756A",
  "#C4A035",
  "#6B7BB5",
] as const;

export function branchColorForIndex(index: number): string {
  return MIND_MAP_BRANCH_COLORS[index % MIND_MAP_BRANCH_COLORS.length]!;
}

/** Viewport width below which the LTR single-direction layout is used. */
export const MIND_MAP_MOBILE_BREAKPOINT = 720;
