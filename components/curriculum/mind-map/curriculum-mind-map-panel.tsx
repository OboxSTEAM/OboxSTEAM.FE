"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  getEnrollmentCurriculumMindMap,
  type EnrollmentCurriculumMindMap,
} from "@/lib/api";
import {
  buildMindMapGraph,
  getInitialExpandedIds,
  type MindMapGraphNode,
} from "@/lib/curriculum/mind-map";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

import { MindMapCanvas } from "./mind-map-canvas";
import { MindMapNodeInspector } from "./mind-map-node-inspector";
import { MindMapSkeleton } from "./mind-map-skeleton";

type CurriculumMindMapPanelProps = {
  enrollmentId: string;
  onOpenLesson: (params: {
    activityId?: string;
    assignmentId?: string;
  }) => void;
  className?: string;
};

type LoadState = {
  enrollmentId: string;
  retryKey: number;
  isLoading: boolean;
  loadError: string | null;
  mindMap: EnrollmentCurriculumMindMap | null;
  expandedIds: Set<string>;
  selectedNodeId: string | null;
};

function buildBreadcrumb(
  node: MindMapGraphNode,
  nodesById: Map<string, MindMapGraphNode>,
): string[] {
  const parts: string[] = [];
  let cursor: MindMapGraphNode | undefined = node.parentId
    ? nodesById.get(node.parentId)
    : undefined;
  while (cursor) {
    parts.unshift(cursor.label);
    cursor = cursor.parentId ? nodesById.get(cursor.parentId) : undefined;
  }
  return parts;
}

function createLoadingState(
  enrollmentId: string,
  retryKey: number,
): LoadState {
  return {
    enrollmentId,
    retryKey,
    isLoading: true,
    loadError: null,
    mindMap: null,
    expandedIds: new Set(),
    selectedNodeId: null,
  };
}

export function CurriculumMindMapPanel({
  enrollmentId,
  onOpenLesson,
  className,
}: CurriculumMindMapPanelProps) {
  const reduceMotion = useReducedMotion();
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<LoadState>(() =>
    createLoadingState(enrollmentId, 0),
  );

  if (
    state.enrollmentId !== enrollmentId ||
    state.retryKey !== retryKey
  ) {
    setState(createLoadingState(enrollmentId, retryKey));
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await getEnrollmentCurriculumMindMap(enrollmentId);
        if (cancelled) return;
        if (!result?.data) {
          throw new Error(
            "Enrollment curriculum mind map response missing data.",
          );
        }
        const model = buildMindMapGraph({ mindMap: result.data });
        setState({
          enrollmentId,
          retryKey,
          isLoading: false,
          loadError: null,
          mindMap: result.data,
          expandedIds: getInitialExpandedIds(model),
          selectedNodeId: null,
        });
      } catch (error) {
        if (cancelled) return;
        showAppErrorFromUnknown(error, "generic");
        setState({
          enrollmentId,
          retryKey,
          isLoading: false,
          loadError: "Không tải được bản đồ học tập. Vui lòng thử lại.",
          mindMap: null,
          expandedIds: new Set(),
          selectedNodeId: null,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enrollmentId, retryKey]);

  const model = useMemo(
    () => (state.mindMap ? buildMindMapGraph({ mindMap: state.mindMap }) : null),
    [state.mindMap],
  );

  const nodesById = useMemo(() => {
    const map = new Map<string, MindMapGraphNode>();
    if (!model) return map;
    for (const node of model.nodes) map.set(node.id, node);
    return map;
  }, [model]);

  const selectedNode = state.selectedNodeId
    ? (nodesById.get(state.selectedNodeId) ?? null)
    : null;
  const breadcrumb = selectedNode
    ? buildBreadcrumb(selectedNode, nodesById)
    : [];

  const handleSelectNode = (nodeId: string) => {
    setState((current) => ({
      ...current,
      selectedNodeId:
        current.selectedNodeId === nodeId ? null : nodeId,
    }));
  };

  const handleToggleExpand = (nodeId: string) => {
    setState((current) => {
      const next = new Set(current.expandedIds);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return { ...current, expandedIds: next };
    });
  };

  return (
    <div className={cn("relative h-full min-h-0 w-full", className)}>
      {state.isLoading ? <MindMapSkeleton className="h-full" /> : null}

      {!state.isLoading && state.loadError ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-muted-foreground">{state.loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Thử lại
          </Button>
        </div>
      ) : null}

      {!state.isLoading && !state.loadError && model ? (
        <>
          <MindMapCanvas
            model={model}
            expandedIds={state.expandedIds}
            selectedNodeId={state.selectedNodeId}
            onSelectNode={handleSelectNode}
            onToggleExpand={handleToggleExpand}
            className="h-full"
          />

          <AnimatePresence>
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                className="pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-end sm:inset-x-4 sm:top-4"
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: -12, scale: 0.96 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, y: -8, scale: 0.97 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 28 }
                }
              >
                <div className="pointer-events-auto w-full max-w-sm">
                  <MindMapNodeInspector
                    node={selectedNode}
                    breadcrumb={breadcrumb}
                    onClose={() =>
                      setState((current) => ({
                        ...current,
                        selectedNodeId: null,
                      }))
                    }
                    onOpenLesson={onOpenLesson}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  );
}
