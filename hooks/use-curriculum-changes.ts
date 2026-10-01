"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCurriculumChanges,
  markCurriculumChangesSeen,
  type CurriculumChanges,
} from "@/lib/api";
import { registerAdvisorySyncHandler } from "@/lib/realtime/advisory-sync-bus";
import { useSyncEvent } from "@/hooks/use-sync-event";

const CHANGES_REFRESH_DEBOUNCE_MS = 300;

/** Comparison base for the default (non-pinned) view. */
export type CurriculumChangesBase = "lastApproval" | "lastSeen" | "start";

export type CurriculumChangesSelection =
  | { kind: "base"; base: CurriculumChangesBase }
  /** Fixed range, e.g. opened from a system message. */
  | { kind: "range"; fromVersion: number; toVersion: number };

type ChangesSnapshot = { key: string; data: CurriculumChanges };
type ChangesFailure = { key: string; error: unknown };

export type UseCurriculumChangesResult = {
  data: CurriculumChanges | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  /** Records `version` as seen; resolves `true` when the server accepted it. */
  markSeen: (version: number) => Promise<boolean>;
};

/** Consolidated curriculum diff; live views refetch on curriculum edits and approval changes. */
export function useCurriculumChanges(
  programId: string,
  selection: CurriculumChangesSelection,
  options: { enabled?: boolean } = {},
): UseCurriculumChangesResult {
  const { enabled = true } = options;
  const isActive = enabled && Boolean(programId);

  const base = selection.kind === "range" ? `version:${selection.fromVersion}` : selection.base;
  const to = selection.kind === "range" ? selection.toVersion : undefined;
  const key = `${programId}|${base}|${to ?? ""}`;
  const isLive = selection.kind === "base";

  const [snapshot, setSnapshot] = useState<ChangesSnapshot | null>(null);
  const [failure, setFailure] = useState<ChangesFailure | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = snapshot?.key === key ? snapshot.data : null;
  const error = failure?.key === key ? failure.error : null;
  const isLoading = isActive && data === null && error === null;

  const refresh = useCallback((): Promise<void> => {
    if (!isActive) return Promise.resolve();
    const requestId = ++requestIdRef.current;
    return getCurriculumChanges(programId, { base, to }).then(
      (next) => {
        if (requestId !== requestIdRef.current) return;
        setSnapshot({ key, data: next });
        setFailure(null);
      },
      (caught: unknown) => {
        if (requestId === requestIdRef.current) setFailure({ key, error: caught });
      },
    );
  }, [base, isActive, key, programId, to]);

  const markSeen = useCallback(
    (version: number): Promise<boolean> =>
      markCurriculumChangesSeen(programId, { version }).then(
        () => {
          setSnapshot((prev) =>
            prev && prev.data.seenVersion < version
              ? { ...prev, data: { ...prev.data, seenVersion: version } }
              : prev,
          );
          return true;
        },
        () => false,
      ),
    [programId],
  );

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void refresh();
    }, CHANGES_REFRESH_DEBOUNCE_MS);
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isActive || !isLive) return;
    const unsubscribe = registerAdvisorySyncHandler(programId, (signal) => {
      if (signal.scope === "advisory.approvalChanged" || signal.scope === "resync") {
        scheduleRefresh();
      }
    });
    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [isActive, isLive, programId, scheduleRefresh]);

  useSyncEvent(isActive && isLive ? programId : null, scheduleRefresh);

  return { data, isLoading, error, refresh, markSeen };
}
