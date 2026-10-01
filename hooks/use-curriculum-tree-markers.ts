"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
import { useCurriculumChanges } from "@/hooks/use-curriculum-changes";
import { useSyncEvent } from "@/hooks/use-sync-event";
import {
  buildTreeChangeMarkers,
  buildTreeDiscussionCounts,
  type TreeChangeMarkers,
  type TreeDiscussionCounts,
} from "@/lib/advisory/tree-markers";
import { getMentionCounts, type MentionCount } from "@/lib/api";
import { registerAdvisorySyncHandler } from "@/lib/realtime/advisory-sync-bus";

const COUNTS_REFRESH_DEBOUNCE_MS = 400;
const EMPTY_COUNTS: MentionCount[] = [];
const EMPTY_MAP = new Map<never, never>();

type AdvisoryChatValue = ReturnType<typeof useAdvisoryChat>;
type CountsSnapshot = { programId: string; counts: MentionCount[] };

export type CurriculumTreeMarkers = {
  /** Exact per-component counts (detail header). */
  mentionCounts: readonly MentionCount[];
  /** Rolled-up badge totals keyed by tree anchor. */
  discussionCounts: TreeDiscussionCounts;
  /** Unseen changes (made by others), keyed by tree anchor. */
  changeMarkers: TreeChangeMarkers;
};

/**
 * Discussion badges and change markers for the curriculum tree. Inert (empty maps,
 * no requests) when the tree is rendered outside an advisory chat provider.
 */
export function useCurriculumTreeMarkers(chat: AdvisoryChatValue | null): CurriculumTreeMarkers {
  const programId = chat?.programId ?? "";
  const isActive = Boolean(programId);
  const getTarget = chat?.mentions.getTarget;
  const unseenChangeCount = chat?.workspace?.unseenChangeCount ?? 0;

  const [snapshot, setSnapshot] = useState<CountsSnapshot | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mentionCounts =
    snapshot?.programId === programId ? snapshot.counts : EMPTY_COUNTS;

  const refreshCounts = useCallback((): Promise<void> => {
    if (!isActive) return Promise.resolve();
    const requestId = ++requestIdRef.current;
    return getMentionCounts(programId).then(
      (counts) => {
        if (requestId === requestIdRef.current) setSnapshot({ programId, counts });
      },
      () => {
        /* badges are decoration — keep the last counts on failure */
      },
    );
  }, [isActive, programId]);

  const scheduleCountsRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void refreshCounts();
    }, COUNTS_REFRESH_DEBOUNCE_MS);
  }, [refreshCounts]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (!isActive) return;
    const unsubscribe = registerAdvisorySyncHandler(programId, (signal) => {
      if (signal.scope !== "advisory.approvalChanged") scheduleCountsRefresh();
    });
    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [isActive, programId, scheduleCountsRefresh]);

  useSyncEvent(isActive ? programId : null, scheduleCountsRefresh);

  const changes = useCurriculumChanges(
    programId,
    { kind: "base", base: "lastSeen" },
    { enabled: isActive },
  );
  const { refresh: refreshChanges } = changes;

  // Marking changes as seen happens in the changes panel; it only surfaces here as a
  // new workspace `unseenChangeCount`.
  const lastUnseenCountRef = useRef(unseenChangeCount);
  useEffect(() => {
    if (lastUnseenCountRef.current === unseenChangeCount) return;
    lastUnseenCountRef.current = unseenChangeCount;
    void refreshChanges();
  }, [refreshChanges, unseenChangeCount]);

  const discussionCounts = useMemo(
    () => (getTarget ? buildTreeDiscussionCounts(mentionCounts, getTarget) : EMPTY_MAP),
    [getTarget, mentionCounts],
  );

  const changeItems = changes.data?.items;
  const changeMarkers = useMemo(
    () =>
      changeItems && unseenChangeCount > 0 ? buildTreeChangeMarkers(changeItems) : EMPTY_MAP,
    [changeItems, unseenChangeCount],
  );

  return { mentionCounts, discussionCounts, changeMarkers };
}
