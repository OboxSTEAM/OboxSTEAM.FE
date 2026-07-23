"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Local drag order for motion `Reorder.Group` — parent is notified once on drop.
 * Keeps the dropped order until `ids` catch up so the list does not snap back
 * while the save/refresh round-trip runs.
 */
export function useDragReorderList(ids: string[]) {
  const entryIdsKey = ids.join("|");
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const isDraggingRef = useRef(false);
  const dragOrderRef = useRef<string[] | null>(null);
  const pendingCommitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDraggingRef.current) return;
    // Parent synced (or changed for another reason) — release local override.
    setDragOrder(null);
    dragOrderRef.current = null;
    pendingCommitKeyRef.current = null;
  }, [entryIdsKey]);

  const values = dragOrder ?? ids;

  const onReorder = (nextIds: string[]) => {
    isDraggingRef.current = true;
    dragOrderRef.current = nextIds;
    setDragOrder(nextIds);
  };

  const commitDrag = (
    onCommit: (orderedIds: string[]) => void | Promise<void>,
  ) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const next = dragOrderRef.current;
    if (!next || next.join("|") === entryIdsKey) {
      setDragOrder(null);
      dragOrderRef.current = null;
      pendingCommitKeyRef.current = null;
      return;
    }

    // Keep optimistic order until `ids` update; roll back if save fails.
    const commitKey = next.join("|");
    pendingCommitKeyRef.current = commitKey;

    void Promise.resolve(onCommit(next)).catch(() => {
      if (pendingCommitKeyRef.current !== commitKey) return;
      pendingCommitKeyRef.current = null;
      setDragOrder(null);
      dragOrderRef.current = null;
    });
  };

  return { values, onReorder, commitDrag };
}
