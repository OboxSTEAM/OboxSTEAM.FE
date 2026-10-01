"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getAdvisoryWorkspace, type AdvisoryWorkspace } from "@/lib/api";
import { registerAdvisorySyncHandler } from "@/lib/realtime/advisory-sync-bus";
import { useAdvisoryPresence } from "@/hooks/use-advisory-presence";
import { useSyncEvent } from "@/hooks/use-sync-event";

const WORKSPACE_REFRESH_DEBOUNCE_MS = 300;

type UseAdvisoryWorkspaceOptions = {
  /** RSC-seeded workspace; skips the first fetch when it matches `programId`. */
  initialData?: AdvisoryWorkspace | null;
  enabled?: boolean;
};

type UseAdvisoryWorkspaceResult = {
  workspace: AdvisoryWorkspace | null;
  isLoading: boolean;
  /** Last load error; stale `workspace` is kept on refresh failures. */
  error: unknown;
  /** Joined the advisory realtime group (presence + live events). */
  isRealtimeJoined: boolean;
  refresh: () => Promise<AdvisoryWorkspace | null>;
  /** Apply a workspace returned by a mutation (request/approve/revoke). */
  applyWorkspace: (next: AdvisoryWorkspace) => void;
};

type WorkspaceFailure = { programId: string; error: unknown };

/**
 * Advisory workspace header (status, approval, capabilities, counts) for one program.
 * Joins the advisory group and refetches on approval/pin events, curriculum
 * structure changes and hub reconnects. Discussion events are left to the chat hook.
 */
export function useAdvisoryWorkspace(
  programId: string,
  options: UseAdvisoryWorkspaceOptions = {},
): UseAdvisoryWorkspaceResult {
  const { initialData = null, enabled = true } = options;
  const hasSeed = initialData?.programId === programId;

  const [workspace, setWorkspace] = useState<AdvisoryWorkspace | null>(
    hasSeed ? initialData : null,
  );
  const [failure, setFailure] = useState<WorkspaceFailure | null>(null);

  const skipSeededFetchRef = useRef(hasSeed);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isJoined } = useAdvisoryPresence(programId, enabled);

  const currentWorkspace = workspace?.programId === programId ? workspace : null;
  const currentError = failure?.programId === programId ? failure.error : null;
  const isLoading =
    enabled && Boolean(programId) && currentWorkspace === null && currentError === null;

  const refresh = useCallback(async () => {
    if (!enabled || !programId) return null;
    const requestId = ++requestIdRef.current;
    try {
      const next = await getAdvisoryWorkspace(programId);
      if (requestId !== requestIdRef.current) return null;
      setWorkspace(next);
      setFailure(null);
      return next;
    } catch (error) {
      if (requestId === requestIdRef.current) setFailure({ programId, error });
      return null;
    }
  }, [enabled, programId]);

  const refreshSilently = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const applyWorkspace = useCallback((next: AdvisoryWorkspace) => {
    requestIdRef.current += 1;
    setWorkspace(next);
    setFailure(null);
  }, []);

  useEffect(() => {
    if (!enabled || !programId) return;
    if (skipSeededFetchRef.current) {
      skipSeededFetchRef.current = false;
      return;
    }
    void refresh();
  }, [enabled, programId, refresh]);

  useEffect(() => {
    if (!enabled || !programId) return;

    const unsubscribe = registerAdvisorySyncHandler(programId, (signal) => {
      if (signal.scope === "advisory.discussionChanged") return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void refresh();
      }, WORKSPACE_REFRESH_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [enabled, programId, refresh]);

  useSyncEvent(enabled ? programId : null, refreshSilently);

  return {
    workspace: currentWorkspace,
    isLoading,
    error: currentError,
    isRealtimeJoined: isJoined,
    refresh,
    applyWorkspace,
  };
}
