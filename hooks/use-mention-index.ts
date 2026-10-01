"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getMentionTargets,
  type CurriculumTargetType,
  type MentionTarget,
} from "@/lib/api";
import {
  buildMentionSearchIndex,
  DEFAULT_MENTION_SEARCH_LIMIT,
  searchMentionTargets,
} from "@/lib/advisory/mention-search";
import { mentionKey } from "@/lib/advisory/mention-token";
import { useSyncEvent } from "@/hooks/use-sync-event";

type UseMentionIndexResult = {
  /** All components in tree order. */
  targets: MentionTarget[];
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  /** Ranked, accent-insensitive search (see `searchMentionTargets`). */
  search: (query: string, limit?: number) => MentionTarget[];
  /** Live component for a mention, or `undefined` when it no longer exists. */
  getTarget: (targetType: CurriculumTargetType, targetId: string) => MentionTarget | undefined;
};

type TargetsSnapshot = { programId: string; targets: MentionTarget[] };
type TargetsFailure = { programId: string; error: unknown };

/**
 * Mentionable curriculum components for one program — backs the `@` picker and
 * chip navigation. Refetches on `curriculum.structureChanged` (debounced by the bus).
 */
export function useMentionIndex(
  programId: string,
  options: { enabled?: boolean } = {},
): UseMentionIndexResult {
  const { enabled = true } = options;

  const [snapshot, setSnapshot] = useState<TargetsSnapshot | null>(null);
  const [failure, setFailure] = useState<TargetsFailure | null>(null);
  const requestIdRef = useRef(0);

  const targets = useMemo(
    () => (snapshot?.programId === programId ? snapshot.targets : []),
    [programId, snapshot],
  );
  const hasTargets = snapshot?.programId === programId;
  const error = failure?.programId === programId ? failure.error : null;
  const isLoading = enabled && Boolean(programId) && !hasTargets && error === null;

  const refresh = useCallback((): Promise<void> => {
    if (!enabled || !programId) return Promise.resolve();
    const requestId = ++requestIdRef.current;
    return getMentionTargets(programId).then(
      (next) => {
        if (requestId !== requestIdRef.current) return;
        setSnapshot({ programId, targets: next });
        setFailure(null);
      },
      (caught: unknown) => {
        if (requestId === requestIdRef.current) setFailure({ programId, error: caught });
      },
    );
  }, [enabled, programId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useSyncEvent(enabled ? programId : null, refresh);

  const searchIndex = useMemo(() => buildMentionSearchIndex(targets), [targets]);
  const targetsByKey = useMemo(
    () =>
      new Map(targets.map((target) => [mentionKey(target.targetType, target.targetId), target])),
    [targets],
  );

  const search = useCallback(
    (query: string, limit = DEFAULT_MENTION_SEARCH_LIMIT) =>
      searchMentionTargets(searchIndex, query, limit),
    [searchIndex],
  );

  const getTarget = useCallback(
    (targetType: CurriculumTargetType, targetId: string) =>
      targetsByKey.get(mentionKey(targetType, targetId)),
    [targetsByKey],
  );

  return { targets, isLoading, error, refresh, search, getTarget };
}
