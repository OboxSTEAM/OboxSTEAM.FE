"use client";

import { useEffect, useRef, useState } from "react";

import {
  getHighlightStackById,
  type HighlightVideoStack,
} from "@/lib/api";

export const HIGHLIGHT_POLL_MS = 2500;
export const HIGHLIGHT_POLL_MAX_MS = 15 * 60 * 1000;

type UseHighlightStackPollingOptions = {
  stackId: string | null;
  /** Bump to restart polling for the same stack (after trim/add-segment). */
  pollNonce?: number;
  enabled?: boolean;
  onCompleted?: (stack: HighlightVideoStack) => void;
  onFailed?: (stack: HighlightVideoStack) => void;
  onTimedOut?: (stackId: string) => void;
};

export function useHighlightStackPolling({
  stackId,
  pollNonce = 0,
  enabled = true,
  onCompleted,
  onFailed,
  onTimedOut,
}: UseHighlightStackPollingOptions) {
  const [stack, setStack] = useState<HighlightVideoStack | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);
  const onTimedOutRef = useRef(onTimedOut);
  onCompletedRef.current = onCompleted;
  onFailedRef.current = onFailed;
  onTimedOutRef.current = onTimedOut;

  useEffect(() => {
    if (!enabled || !stackId) {
      setIsPolling(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    startedAtRef.current = Date.now();
    setIsPolling(true);

    const tick = async () => {
      if (cancelled || !stackId) return;

      const elapsed = Date.now() - (startedAtRef.current ?? Date.now());
      if (elapsed > HIGHLIGHT_POLL_MAX_MS) {
        setIsPolling(false);
        onTimedOutRef.current?.(stackId);
        return;
      }

      try {
        const result = await getHighlightStackById(stackId);
        if (cancelled) return;
        const next = result?.data;
        if (!next) return;
        setStack(next);

        const processing =
          next.hasProcessingItem ||
          (next.items ?? []).some((item) => item.status === "Processing");
        const failed = (next.items ?? []).some((item) => item.status === "Failed");
        const completed = (next.items ?? []).some(
          (item) => item.status === "Completed" && Boolean(item.videoUrl),
        );

        if (failed && !processing) {
          setIsPolling(false);
          onFailedRef.current?.(next);
          return;
        }

        if (!processing && completed) {
          setIsPolling(false);
          onCompletedRef.current?.(next);
          return;
        }

        if (!processing) {
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
  }, [stackId, pollNonce, enabled]);

  return { stack, isPolling, setStack };
}
