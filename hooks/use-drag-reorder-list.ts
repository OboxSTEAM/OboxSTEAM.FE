"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Local drag order for motion `Reorder.Group` — parent is notified once on drop.
 * Mirrors the portfolio section-outline pattern.
 */
export function useDragReorderList(ids: string[]) {
  const entryIdsKey = ids.join("|");
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const isDraggingRef = useRef(false);
  const dragOrderRef = useRef<string[] | null>(null);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setDragOrder(null);
    dragOrderRef.current = null;
  }, [entryIdsKey]);

  const values = dragOrder ?? ids;

  const onReorder = (nextIds: string[]) => {
    isDraggingRef.current = true;
    dragOrderRef.current = nextIds;
    setDragOrder(nextIds);
  };

  const commitDrag = (onCommit: (orderedIds: string[]) => void) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const next = dragOrderRef.current;
    setDragOrder(null);
    dragOrderRef.current = null;
    if (next && next.join("|") !== entryIdsKey) {
      onCommit(next);
    }
  };

  return { values, onReorder, commitDrag };
}
