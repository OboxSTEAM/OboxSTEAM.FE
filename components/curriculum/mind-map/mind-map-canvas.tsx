"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useGesture } from "@use-gesture/react";
import { AnimatePresence, useReducedMotion } from "motion/react";

import {
  branchColorForIndex,
  fitTransform,
  focusTransform,
  layoutMindMap,
  MIND_MAP_MOBILE_BREAKPOINT,
  preserveNodeScreenPosition,
  type MindMapGraphModel,
  type MindMapLaidOutNode,
  type MindMapLayoutMode,
} from "@/lib/curriculum/mind-map";
import { cn } from "@/lib/utils";

import { MindMapEdges } from "./mind-map-edges";
import { MindMapFloatingControls } from "./mind-map-floating-controls";
import { MindMapNodeCard } from "./mind-map-node-card";

type Viewport = { x: number; y: number; scale: number };

type MindMapCanvasProps = {
  model: MindMapGraphModel;
  expandedIds: Set<string>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  className?: string;
  /** Imperative hooks for toolbar actions. */
  viewportApiRef?: MutableRefObject<MindMapViewportApi | null>;
};

export type MindMapViewportApi = {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  focusCurrent: () => void;
};

const MIN_SCALE = 0.28;
const MAX_SCALE = 2.2;

export function MindMapCanvas({
  model,
  expandedIds,
  selectedNodeId,
  onSelectNode,
  onToggleExpand,
  className,
  viewportApiRef,
}: MindMapCanvasProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hasFittedRef = useRef(false);
  const layoutNodesRef = useRef<MindMapLaidOutNode[]>([]);
  const pendingPreserveIdRef = useRef<string | null>(null);

  const layoutMode: MindMapLayoutMode =
    size.width > 0 && size.width < MIND_MAP_MOBILE_BREAKPOINT
      ? "ltr"
      : "bilateral";

  const layout = useMemo(
    () => layoutMindMap(model, expandedIds, { mode: layoutMode }),
    [expandedIds, layoutMode, model],
  );

  const nodesById = useMemo(() => {
    const map = new Map<string, MindMapLaidOutNode>();
    for (const node of layout.nodes) map.set(node.id, node);
    return map;
  }, [layout.nodes]);

  const moduleColorIndex = useMemo(() => {
    const map = new Map<string, number>();
    let index = 0;
    for (const node of model.nodes) {
      if (node.kind === "module") {
        map.set(node.id, index);
        index += 1;
      }
    }
    return map;
  }, [model.nodes]);

  const branchColorByNodeId = useMemo(() => {
    const colors = new Map<string, string>();
    const resolveModuleColor = (nodeId: string): string => {
      let cursor = nodesById.get(nodeId);
      while (cursor) {
        if (cursor.kind === "module") {
          const idx = moduleColorIndex.get(cursor.id) ?? 0;
          return branchColorForIndex(idx);
        }
        cursor = cursor.parentId ? nodesById.get(cursor.parentId) : undefined;
      }
      return branchColorForIndex(0);
    };

    for (const node of layout.nodes) {
      if (node.kind === "program") {
        colors.set(node.id, "#2D2D2D");
        continue;
      }
      colors.set(node.id, resolveModuleColor(node.id));
    }
    return colors;
  }, [layout.nodes, moduleColorIndex, nodesById]);

  const applyFit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const next = fitTransform(layout.bounds, el.clientWidth, el.clientHeight);
    setViewport(next);
  }, [layout.bounds]);

  const applyFocusCurrent = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const current =
      layout.nodes.find(
        (node) =>
          node.isOnCurrentPath &&
          (node.kind === "activity" ||
            node.kind === "assignment" ||
            node.status === "current"),
      ) ??
      layout.nodes.find((node) => node.isOnCurrentPath && node.kind === "module") ??
      layout.nodes.find((node) => node.kind === "program");

    if (!current) {
      applyFit();
      return;
    }

    setViewport((prev) =>
      focusTransform(current, el.clientWidth, el.clientHeight, prev.scale),
    );
  }, [applyFit, layout.nodes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return;
    if (!hasFittedRef.current) {
      applyFit();
      hasFittedRef.current = true;
      // On first paint for small screens, prefer the current learning node.
      if (size.width < MIND_MAP_MOBILE_BREAKPOINT) {
        requestAnimationFrame(() => applyFocusCurrent());
      }
    }
  }, [applyFit, applyFocusCurrent, size.height, size.width]);

  useEffect(() => {
    hasFittedRef.current = false;
  }, [model.enrollmentId]);

  // Re-fit when switching between bilateral and LTR layouts.
  const prevModeRef = useRef(layoutMode);
  useEffect(() => {
    if (prevModeRef.current === layoutMode) return;
    prevModeRef.current = layoutMode;
    if (size.width <= 0 || size.height <= 0) return;
    applyFit();
  }, [applyFit, layoutMode, size.height, size.width]);

  // Preserve the toggled parent’s screen position across expansion layout shifts.
  useEffect(() => {
    const preserveId = pendingPreserveIdRef.current;
    const prevNodes = layoutNodesRef.current;
    layoutNodesRef.current = layout.nodes;

    if (!preserveId) return;

    const prev = prevNodes.find((node) => node.id === preserveId);
    const next = layout.nodes.find((node) => node.id === preserveId);
    pendingPreserveIdRef.current = null;

    if (!prev || !next) return;

    setViewport((current) =>
      preserveNodeScreenPosition(prev, next, current),
    );
  }, [layout.nodes]);

  useEffect(() => {
    if (!viewportApiRef) return;
    viewportApiRef.current = {
      fit: applyFit,
      focusCurrent: applyFocusCurrent,
      zoomIn: () =>
        setViewport((prev) => ({
          ...prev,
          scale: Math.min(MAX_SCALE, prev.scale * 1.15),
        })),
      zoomOut: () =>
        setViewport((prev) => ({
          ...prev,
          scale: Math.max(MIN_SCALE, prev.scale / 1.15),
        })),
    };
    return () => {
      viewportApiRef.current = null;
    };
  }, [applyFit, applyFocusCurrent, viewportApiRef]);

  const handleToggleExpand = useCallback(
    (nodeId: string) => {
      pendingPreserveIdRef.current = nodeId;
      onToggleExpand(nodeId);
    },
    [onToggleExpand],
  );

  useGesture(
    {
      onDrag: ({ delta: [dx, dy], event, pinching }) => {
        if (pinching) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest("button")) return;
        setViewport((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mx = event.clientX - rect.left;
        const my = event.clientY - rect.top;
        const factor = dy > 0 ? 0.92 : 1.08;

        setViewport((prev) => {
          const nextScale = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, prev.scale * factor),
          );
          const ratio = nextScale / prev.scale;
          return {
            scale: nextScale,
            x: mx - (mx - prev.x) * ratio,
            y: my - (my - prev.y) * ratio,
          };
        });
      },
      onPinch: ({ offset: [scale], origin: [ox, oy], memo }) => {
        const el = containerRef.current;
        if (!el) return memo;
        const rect = el.getBoundingClientRect();
        const mx = ox - rect.left;
        const my = oy - rect.top;
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

        setViewport((prev) => {
          const base = (memo as Viewport | undefined) ?? prev;
          const ratio = nextScale / base.scale;
          return {
            scale: nextScale,
            x: mx - (mx - base.x) * ratio,
            y: my - (my - base.y) * ratio,
          };
        });
        return memo ?? viewport;
      },
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      drag: { filterTaps: true },
      pinch: { scaleBounds: { min: MIN_SCALE, max: MAX_SCALE }, rubberband: true },
      wheel: { eventOptions: { passive: false } },
    },
  );

  const dotScale = Math.max(14, 20 / viewport.scale);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden bg-[#FAFAF5] active:cursor-grabbing",
        className,
      )}
      role="application"
      aria-label="Bản đồ học tập tương tác"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(45,43,39,0.12) 1px, transparent 1.15px)`,
          backgroundSize: `${dotScale}px ${dotScale}px`,
          backgroundPosition: `${viewport.x % dotScale}px ${viewport.y % dotScale}px`,
        }}
        aria-hidden
      />

      <div
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
          transition: reduceMotion ? undefined : "transform 120ms ease-out",
        }}
      >
        <MindMapEdges
          edges={layout.edges}
          forks={layout.forks}
          nodesById={nodesById}
          bounds={layout.bounds}
          branchColorByNodeId={branchColorByNodeId}
        />

        <AnimatePresence initial={false}>
          {layout.nodes.map((node) => (
            <MindMapNodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isExpanded={expandedIds.has(node.id)}
              branchColor={branchColorByNodeId.get(node.id) ?? branchColorForIndex(0)}
              onSelect={onSelectNode}
              onToggleExpand={
                node.isExpandable ? handleToggleExpand : undefined
              }
            />
          ))}
        </AnimatePresence>
      </div>

      <MindMapFloatingControls
        onFit={applyFit}
        onZoomIn={() =>
          setViewport((prev) => ({
            ...prev,
            scale: Math.min(MAX_SCALE, prev.scale * 1.15),
          }))
        }
        onZoomOut={() =>
          setViewport((prev) => ({
            ...prev,
            scale: Math.max(MIN_SCALE, prev.scale / 1.15),
          }))
        }
        onFocusCurrent={applyFocusCurrent}
      />
    </div>
  );
}
