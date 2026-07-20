"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";

import type { MindMapGraphEdge, MindMapLaidOutNode } from "@/lib/curriculum/mind-map";
import { cn } from "@/lib/utils";

type MindMapEdgesProps = {
  edges: MindMapGraphEdge[];
  nodesById: Map<string, MindMapLaidOutNode>;
  bounds: { minX: number; minY: number; width: number; height: number };
  /** nodeId → branch color */
  branchColorByNodeId: Map<string, string>;
};

function cubicPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  // Soft organic curve — control points sit along the chord with a perpendicular bow.
  const bow = Math.min(48, dist * 0.22);
  const nx = -dy / dist;
  const ny = dx / dist;
  const c1x = x1 + dx * 0.35 + nx * bow;
  const c1y = y1 + dy * 0.35 + ny * bow;
  const c2x = x1 + dx * 0.65 - nx * bow * 0.4;
  const c2y = y1 + dy * 0.65 - ny * bow * 0.4;
  return `M ${x1} ${y1} C ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`;
}

export function MindMapEdges({
  edges,
  nodesById,
  bounds,
  branchColorByNodeId,
}: MindMapEdgesProps) {
  const reduceMotion = useReducedMotion();

  const sorted = useMemo(() => {
    // Draw current-path edges last so they sit above.
    return [...edges].sort(
      (left, right) => Number(left.isOnCurrentPath) - Number(right.isOnCurrentPath),
    );
  }, [edges]);

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
      <style>{`
        @keyframes mindmap-dash-flow {
          to { stroke-dashoffset: -28; }
        }
        .mindmap-current-dash {
          stroke-dasharray: 5 9;
          animation: mindmap-dash-flow 1.1s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mindmap-current-dash { animation: none; }
        }
      `}</style>
      {sorted.map((edge) => {
        const source = nodesById.get(edge.sourceId);
        const target = nodesById.get(edge.targetId);
        if (!source || !target) return null;

        const x1 = source.x - bounds.minX;
        const y1 = source.y - bounds.minY;
        const x2 = target.x - bounds.minX;
        const y2 = target.y - bounds.minY;
        const d = cubicPath(x1, y1, x2, y2);
        const color =
          branchColorByNodeId.get(target.id) ??
          branchColorByNodeId.get(source.id) ??
          "#C8C8C0";

        if (edge.isOnCurrentPath) {
          return (
            <g key={edge.id}>
              <path
                d={d}
                fill="none"
                stroke={`${color}33`}
                strokeWidth={6}
                strokeLinecap="round"
              />
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                className={cn(!reduceMotion && "mindmap-current-dash")}
                strokeDasharray={reduceMotion ? "5 9" : undefined}
              />
            </g>
          );
        }

        return (
          <path
            key={edge.id}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={source.kind === "program" ? 3.2 : 1.6}
            strokeLinecap="round"
            opacity={source.kind === "program" ? 0.85 : 0.45}
          />
        );
      })}
    </svg>
  );
}
