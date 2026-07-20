"use client";

import { useMemo } from "react";

import type {
  MindMapBranchSide,
  MindMapForkJunction,
  MindMapGraphEdge,
  MindMapLaidOutNode,
} from "@/lib/curriculum/mind-map";

type MindMapEdgesProps = {
  edges: MindMapGraphEdge[];
  forks: MindMapForkJunction[];
  nodesById: Map<string, MindMapLaidOutNode>;
  bounds: { minX: number; minY: number; width: number; height: number };
  /** nodeId → branch color */
  branchColorByNodeId: Map<string, string>;
};

const NEUTRAL_STROKE = "#C5BFB4";
const CURRENT_STROKE = "#E94B3C";

function outwardEdgeX(node: MindMapLaidOutNode, side: MindMapBranchSide): number {
  return side === "right"
    ? node.x + node.width / 2
    : node.x - node.width / 2;
}

function inwardEdgeX(node: MindMapLaidOutNode, side: MindMapBranchSide): number {
  return side === "right"
    ? node.x - node.width / 2
    : node.x + node.width / 2;
}

/** Smooth horizontal-biased cubic between two points. */
function branchCurve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = x2 - x1;
  const midX = x1 + dx * 0.5;
  return `M ${x1} ${y1} C ${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`;
}

function EdgeStroke({
  d,
  color,
  strokeWidth,
  opacity = 1,
  isCurrent,
}: {
  d: string;
  color: string;
  strokeWidth: number;
  opacity?: number;
  isCurrent: boolean;
}) {
  if (isCurrent) {
    return (
      <g>
        <path
          d={d}
          fill="none"
          stroke={`${CURRENT_STROKE}28`}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
        />
        <path
          d={d}
          fill="none"
          stroke={CURRENT_STROKE}
          strokeWidth={strokeWidth + 0.4}
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}

export function MindMapEdges({
  edges,
  forks,
  nodesById,
  bounds,
  branchColorByNodeId,
}: MindMapEdgesProps) {
  const forkedChildIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fork of forks) {
      for (const childId of fork.childIds) ids.add(childId);
    }
    return ids;
  }, [forks]);

  const directEdges = useMemo(() => {
    return edges
      .filter((edge) => !forkedChildIds.has(edge.targetId))
      .sort(
        (left, right) =>
          Number(left.isOnCurrentPath) - Number(right.isOnCurrentPath),
      );
  }, [edges, forkedChildIds]);

  const sortedForks = useMemo(() => {
    return [...forks].sort(
      (left, right) =>
        Number(left.isOnCurrentPath) - Number(right.isOnCurrentPath),
    );
  }, [forks]);

  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{
        left: bounds.minX,
        top: bounds.minY,
        width: bounds.width,
        height: bounds.height,
      }}
      aria-hidden
    >
      {directEdges.map((edge) => {
        const source = nodesById.get(edge.sourceId);
        const target = nodesById.get(edge.targetId);
        if (!source || !target) return null;

        const side = target.side;
        const x1 = outwardEdgeX(source, side) - bounds.minX;
        const y1 = source.y - bounds.minY;
        const x2 = inwardEdgeX(target, side) - bounds.minX;
        const y2 = target.y - bounds.minY;
        const d = branchCurve(x1, y1, x2, y2);
        const accent =
          branchColorByNodeId.get(target.id) ??
          branchColorByNodeId.get(source.id) ??
          NEUTRAL_STROKE;
        const color = edge.isOnCurrentPath ? CURRENT_STROKE : accent;

        return (
          <EdgeStroke
            key={edge.id}
            d={d}
            color={color}
            strokeWidth={source.kind === "program" ? 2.8 : 1.6}
            opacity={source.kind === "program" ? 0.85 : 0.55}
            isCurrent={edge.isOnCurrentPath}
          />
        );
      })}

      {sortedForks.map((fork) => {
        const parent = nodesById.get(fork.parentId);
        if (!parent) return null;

        const side = fork.side;
        const jx = fork.x - bounds.minX;
        const jy = fork.y - bounds.minY;
        const px = outwardEdgeX(parent, side) - bounds.minX;
        const py = parent.y - bounds.minY;
        const accent =
          branchColorByNodeId.get(fork.parentId) ??
          branchColorByNodeId.get(fork.childIds[0] ?? "") ??
          NEUTRAL_STROKE;

        const stemCurrent = fork.isOnCurrentPath || parent.isOnCurrentPath;
        const stem = branchCurve(px, py, jx, jy);

        return (
          <g key={fork.id}>
            <EdgeStroke
              d={stem}
              color={stemCurrent ? CURRENT_STROKE : accent}
              strokeWidth={parent.kind === "program" ? 2.6 : parent.kind === "module" ? 2.1 : 1.6}
              opacity={0.7}
              isCurrent={stemCurrent}
            />

            {fork.childIds.map((childId) => {
              const child = nodesById.get(childId);
              if (!child) return null;
              const tx = inwardEdgeX(child, side) - bounds.minX;
              const ty = child.y - bounds.minY;
              const arm = branchCurve(jx, jy, tx, ty);
              const armCurrent =
                child.isOnCurrentPath || fork.isOnCurrentPath;

              return (
                <EdgeStroke
                  key={`${fork.id}->${childId}`}
                  d={arm}
                  color={
                    armCurrent
                      ? CURRENT_STROKE
                      : (branchColorByNodeId.get(childId) ?? accent)
                  }
                  strokeWidth={1.5}
                  opacity={0.5}
                  isCurrent={armCurrent}
                />
              );
            })}

            <circle
              cx={jx}
              cy={jy}
              r={3.5}
              fill="#FAFAF5"
              stroke={stemCurrent ? CURRENT_STROKE : accent}
              strokeWidth={1.75}
              opacity={0.95}
            />
          </g>
        );
      })}
    </svg>
  );
}
