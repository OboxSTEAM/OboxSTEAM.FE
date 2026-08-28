"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getProgramOpenClasses,
  type OpenEnrollmentClass,
} from "@/lib/api";
import {
  joinProgramSync,
  leaveProgramSync,
} from "@/lib/realtime/program-sync-membership";
import { registerSeatsSyncHandler } from "@/lib/realtime/seats-sync-bus";
import { acquireSyncHub } from "@/lib/realtime/sync-hub-connection";
import { getPreferredClassId } from "@/lib/programs/preferred-class";

type UseProgramOpenClassesResult = {
  classes: OpenEnrollmentClass[];
  isLoading: boolean;
  hasError: boolean;
  hasOpenSeats: boolean;
  refresh: (preferredClassId?: string | null) => Promise<OpenEnrollmentClass[]>;
};

/**
 * Public open-class preview for a program.
 * Starts shared SignalR hub (incl. guests), joins `JoinProgramSync`, refetches on `seats.changed`.
 */
export function useProgramOpenClasses(
  programId: string,
  options?: { preferredClassId?: string | null; enabled?: boolean },
): UseProgramOpenClassesResult {
  const enabled = options?.enabled ?? true;
  const [classes, setClasses] = useState<OpenEnrollmentClass[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [hasError, setHasError] = useState(false);

  const fetchOpenClasses = useCallback(
    async (preferredClassId?: string | null) => {
      const preferred =
        preferredClassId !== undefined
          ? preferredClassId
          : getPreferredClassId(programId);
      const result = await getProgramOpenClasses(programId, {
        preferredClassId: preferred,
      });
      return result?.data ?? [];
    },
    [programId],
  );

  const refresh = useCallback(
    async (preferredClassId?: string | null) => {
      if (!enabled) return [];
      setIsLoading(true);
      setHasError(false);
      try {
        const next = await fetchOpenClasses(preferredClassId);
        setClasses(next);
        return next;
      } catch {
        setClasses([]);
        setHasError(true);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, fetchOpenClasses],
  );

  const refreshSilent = useCallback(
    async (preferredClassId?: string | null) => {
      if (!enabled) return [];
      try {
        const next = await fetchOpenClasses(preferredClassId);
        setClasses(next);
        setHasError(false);
        return next;
      } catch {
        return [];
      }
    },
    [enabled, fetchOpenClasses],
  );

  useEffect(() => {
    setClasses([]);
    setHasError(false);
    if (enabled) {
      setIsLoading(true);
    }
  }, [programId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setClasses([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }
    void refresh(options?.preferredClassId);
  }, [enabled, options?.preferredClassId, programId, refresh]);

  useEffect(() => {
    if (!enabled || !programId) return;

    const releaseHub = acquireSyncHub();
    void joinProgramSync(programId);
    const unsubscribe = registerSeatsSyncHandler(programId, () => {
      void refreshSilent();
    });

    return () => {
      unsubscribe();
      leaveProgramSync(programId);
      releaseHub();
    };
  }, [enabled, programId, refreshSilent]);

  return {
    classes,
    isLoading,
    hasError,
    hasOpenSeats: classes.some((item) => item.seatsRemaining > 0),
    refresh,
  };
}
