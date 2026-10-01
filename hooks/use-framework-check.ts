"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getAdvisoryFrameworkCheck, type ProgramFrameworkCheck } from "@/lib/api";
import { useSyncEvent } from "@/hooks/use-sync-event";

type CheckSnapshot = { programId: string; check: ProgramFrameworkCheck };
type CheckFailure = { programId: string; error: unknown };

export type UseFrameworkCheckResult = {
  /** Latest result; kept while a refresh is in flight or fails. */
  check: ProgramFrameworkCheck | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  /** Apply a result returned elsewhere (e.g. a `FRAMEWORK_CHECK_FAILED` error body). */
  applyCheck: (check: ProgramFrameworkCheck) => void;
};

/** Live framework rules for one program; refetches on curriculum structure changes. */
export function useFrameworkCheck(
  programId: string,
  options: { enabled?: boolean } = {},
): UseFrameworkCheckResult {
  const { enabled = true } = options;
  const isActive = enabled && Boolean(programId);

  const [snapshot, setSnapshot] = useState<CheckSnapshot | null>(null);
  const [failure, setFailure] = useState<CheckFailure | null>(null);
  const requestIdRef = useRef(0);

  const check = snapshot?.programId === programId ? snapshot.check : null;
  const error = failure?.programId === programId ? failure.error : null;
  const isLoading = isActive && check === null && error === null;

  const refresh = useCallback((): Promise<void> => {
    if (!isActive) return Promise.resolve();
    const requestId = ++requestIdRef.current;
    return getAdvisoryFrameworkCheck(programId).then(
      (next) => {
        if (requestId !== requestIdRef.current) return;
        setSnapshot({ programId, check: next });
        setFailure(null);
      },
      (caught: unknown) => {
        if (requestId === requestIdRef.current) setFailure({ programId, error: caught });
      },
    );
  }, [isActive, programId]);

  const applyCheck = useCallback(
    (next: ProgramFrameworkCheck) => {
      requestIdRef.current += 1;
      setSnapshot({ programId, check: next });
      setFailure(null);
    },
    [programId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useSyncEvent(isActive ? programId : null, refresh);

  return { check, isLoading, error, refresh, applyCheck };
}
