"use client";

import { useEffect, useRef, useState } from "react";

import {
  getHighlightStackById,
  getHighlightVideoProgress,
  type HighlightVideoProgress,
  type HighlightVideoStack,
} from "@/lib/api";

export const HIGHLIGHT_POLL_MS = 2500;
export const HIGHLIGHT_POLL_MAX_MS = 15 * 60 * 1000;

type UseHighlightItemProgressPollingOptions = {
  stackId: string | null;
  /** Processing item to poll via GET .../progress. */
  itemId: string | null;
  /** Bump to restart polling (after trim / add-segment / retry / regenerate). */
  pollNonce?: number;
  enabled?: boolean;
  onProgress?: (progress: HighlightVideoProgress) => void;
  onTerminal?: (args: {
    progress: HighlightVideoProgress;
    stack: HighlightVideoStack;
  }) => void;
  onTimedOut?: (stackId: string, itemId: string) => void;
};

/**
 * Polls `GET .../items/{itemId}/progress` every ~2.5s.
 * On terminal status → refreshes `GET .../stacks/{stackId}` once, then stops.
 */
export function useHighlightItemProgressPolling({
  stackId,
  itemId,
  pollNonce = 0,
  enabled = true,
  onProgress,
  onTerminal,
  onTimedOut,
}: UseHighlightItemProgressPollingOptions) {
  const [progress, setProgress] = useState<HighlightVideoProgress | null>(null);
  const [stack, setStack] = useState<HighlightVideoStack | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const onProgressRef = useRef(onProgress);
  const onTerminalRef = useRef(onTerminal);
  const onTimedOutRef = useRef(onTimedOut);
  onProgressRef.current = onProgress;
  onTerminalRef.current = onTerminal;
  onTimedOutRef.current = onTimedOut;

  useEffect(() => {
    if (!enabled || !stackId || !itemId) {
      setIsPolling(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    startedAtRef.current = Date.now();
    setIsPolling(true);
    setProgress(null);

    const tick = async () => {
      if (cancelled || !stackId || !itemId) return;

      const elapsed = Date.now() - (startedAtRef.current ?? Date.now());
      if (elapsed > HIGHLIGHT_POLL_MAX_MS) {
        setIsPolling(false);
        onTimedOutRef.current?.(stackId, itemId);
        return;
      }

      try {
        const result = await getHighlightVideoProgress(stackId, itemId);
        if (cancelled) return;
        const next = result?.data;
        if (!next) {
          timer = setTimeout(() => {
            void tick();
          }, HIGHLIGHT_POLL_MS);
          return;
        }

        setProgress(next);
        onProgressRef.current?.(next);

        const isDone =
          next.isTerminal ||
          next.status === "Completed" ||
          next.status === "Failed" ||
          next.status === "Cancelled";

        if (isDone) {
          try {
            const stackResult = await getHighlightStackById(stackId);
            if (cancelled) return;
            const refreshed = stackResult?.data;
            if (refreshed) {
              setStack(refreshed);
              onTerminalRef.current?.({ progress: next, stack: refreshed });
            }
          } catch {
            // Progress is terminal; stack refresh can retry on next open.
          }
          setIsPolling(false);
          return;
        }
      } catch {
        // Keep polling through transient errors.
      }

      if (!cancelled) {
        timer = setTimeout(() => {
          void tick();
        }, HIGHLIGHT_POLL_MS);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [stackId, itemId, pollNonce, enabled]);

  return { progress, stack, isPolling, setStack, setProgress };
}
