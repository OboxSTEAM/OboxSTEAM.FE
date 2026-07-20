import type {
  MindMapGraphBounds,
  MindMapGraphEdge,
  MindMapGraphModel,
  MindMapGraphNode,
  MindMapLaidOutNode,
  MindMapLayoutResult,
  MindMapNodeKind,
} from "./types";

const NODE_SIZE: Record<MindMapNodeKind, { width: number; height: number }> = {
  program: { width: 200, height: 56 },
  module: { width: 152, height: 112 },
  course: { width: 140, height: 52 },
  milestone: { width: 140, height: 52 },
  activity: { width: 132, height: 36 },
  assignment: { width: 132, height: 36 },
};

/** Generous radii so branches do not collide. */
const MODULE_RADIUS = 360;
const CONTAINER_RADIUS = 220;
const LEAF_RADIUS = 170;
const SIBLING_SPREAD = 0.52;
const LEAF_SPREAD = 0.36;

function emptyBounds(): MindMapGraphBounds {
  return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
}

function computeBounds(nodes: MindMapLaidOutNode[]): MindMapGraphBounds {
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

  const pad = 120;
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
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

/**
 * Radial hub layout with wide sector spacing to avoid overlap.
 */
export function layoutMindMap(
  model: MindMapGraphModel,
  expandedIds: Set<string>,
): MindMapLayoutResult {
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
      bounds: emptyBounds(),
      hubNodeId: "",
    };
  }

  const laidOut: MindMapLaidOutNode[] = [];
  const hubSize = NODE_SIZE.program;

  laidOut.push({
    ...hub,
    x: 0,
    y: 0,
    width: hubSize.width,
    height: hubSize.height,
    depth: 0,
    angle: 0,
  });

  const modules = childrenOf(visibleNodes, hub.id);
  const moduleCount = Math.max(modules.length, 1);
  // Leave a small gap so first/last modules do not collide when count is high.
  const sector = (Math.PI * 2) / moduleCount;

  modules.forEach((moduleNode, moduleIndex) => {
    const angle = moduleIndex * sector - Math.PI / 2;
    const size = NODE_SIZE[moduleNode.kind];
    const ring =
      MODULE_RADIUS + Math.min(moduleCount, 8) * 8;
    const mx = Math.cos(angle) * ring;
    const my = Math.sin(angle) * ring;

    laidOut.push({
      ...moduleNode,
      x: mx,
      y: my,
      width: size.width,
      height: size.height,
      depth: 1,
      angle,
    });

    if (!expandedIds.has(moduleNode.id)) return;

    const containers = childrenOf(visibleNodes, moduleNode.id).filter(
      (child) =>
        child.kind === "course" ||
        child.kind === "milestone" ||
        child.kind === "assignment",
    );

    containers.forEach((container, containerIndex) => {
      const spread =
        containers.length <= 1
          ? 0
          : (containerIndex - (containers.length - 1) / 2) * SIBLING_SPREAD;
      const containerAngle = angle + spread;
      const cx = mx + Math.cos(containerAngle) * CONTAINER_RADIUS;
      const cy = my + Math.sin(containerAngle) * CONTAINER_RADIUS;
      const cSize = NODE_SIZE[container.kind];

      laidOut.push({
        ...container,
        x: cx,
        y: cy,
        width: cSize.width,
        height: cSize.height,
        depth: 2,
        angle: containerAngle,
      });

      if (!container.isExpandable || !expandedIds.has(container.id)) return;

      const leaves = childrenOf(visibleNodes, container.id);
      leaves.forEach((leaf, leafIndex) => {
        const leafSpread =
          leaves.length <= 1
            ? 0
            : (leafIndex - (leaves.length - 1) / 2) * LEAF_SPREAD;
        const leafAngle = containerAngle + leafSpread;
        const lx = cx + Math.cos(leafAngle) * LEAF_RADIUS;
        const ly = cy + Math.sin(leafAngle) * LEAF_RADIUS;
        const lSize = NODE_SIZE[leaf.kind];

        laidOut.push({
          ...leaf,
          x: lx,
          y: ly,
          width: lSize.width,
          height: lSize.height,
          depth: 3,
          angle: leafAngle,
        });
      });
    });
  });

  const edges: MindMapGraphEdge[] = model.edges.filter(
    (edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId),
  );

  return {
    nodes: laidOut,
    edges,
    bounds: computeBounds(laidOut),
    hubNodeId: hub.id,
  };
}

export function fitTransform(
  bounds: MindMapGraphBounds,
  viewportWidth: number,
  viewportHeight: number,
  padding = 56,
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

/** Branch accent colors cycling by module index (Obox STEAM palette). */
export const MIND_MAP_BRANCH_COLORS = [
  "#4FC3F7",
  "#7CB342",
  "#E94B3C",
  "#FDD835",
  "#5C6BC0",
] as const;

export function branchColorForIndex(index: number): string {
  return MIND_MAP_BRANCH_COLORS[index % MIND_MAP_BRANCH_COLORS.length]!;
}
