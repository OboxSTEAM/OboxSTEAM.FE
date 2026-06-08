"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_MIN_SKELETON_MS,
  waitMinSkeleton,
} from "@/lib/ui/min-skeleton-delay";

export type UseClientFetchOptions<T> = {
  /** When false, applies `initialData` and skips the network call. */
  enabled?: boolean;
  fetcher: () => Promise<T | null | undefined>;
  /** Refetch when any value in this list changes (same role as `useEffect` deps). */
  deps: ReadonlyArray<unknown>;
  initialData?: T | null;
  minSkeletonMs?: number;
  onError?: (error: unknown) => void;
};

export type UseClientFetchResult<T> = {
  data: T | null;
  isLoading: boolean;
  hasError: boolean;
  /** Show skeleton immediately before query state updates. */
  markLoading: () => void;
  retry: () => void;
  /** Increments after each successful load — key list animations. */
  resultsEpoch: number;
};

/**
 * Client-side fetch with minimum skeleton visibility and stale-data retention on error.
 * Pair with layout-matched skeletons and `markLoading()` on filter/pagination changes.
 */
export function useClientFetch<T>({
  enabled = true,
  fetcher,
  deps,
  initialData = null,
  minSkeletonMs = DEFAULT_MIN_SKELETON_MS,
  onError,
}: UseClientFetchOptions<T>): UseClientFetchResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(enabled && initialData == null);
  const [hasError, setHasError] = useState(false);
  const [resultsEpoch, setResultsEpoch] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const hasLoadedOnceRef = useRef(initialData != null);

  const markLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const retry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (initialData != null) {
        setData(initialData);
        setHasError(false);
        setIsLoading(false);
      }
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    const finish = async (
      next: T | null | undefined,
      errored: boolean,
    ): Promise<void> => {
      await waitMinSkeleton(startedAt, minSkeletonMs);
      if (cancelled) return;

      if (next != null) {
        setData(next);
        hasLoadedOnceRef.current = true;
        setResultsEpoch((epoch) => epoch + 1);
      } else if (!hasLoadedOnceRef.current) {
        setData(null);
      }

      setHasError(errored);
      setIsLoading(false);
    };

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setHasError(false);

      try {
        const result = await fetcher();
        await finish(result, false);
      } catch (error) {
        onError?.(error);
        await finish(null, true);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-owned dep list
  }, [enabled, minSkeletonMs, retryCount, ...deps]);

  return {
    data,
    isLoading,
    hasError,
    markLoading,
    retry,
    resultsEpoch,
  };
}
