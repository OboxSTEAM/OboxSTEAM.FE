"use client";

import { useEffect } from "react";

import { registerCurriculumSyncHandler } from "@/lib/realtime/curriculum-sync-bus";

/**
 * Subscribe to silent curriculum sync hints for a program-bound screen.
 * Pass a stable refetch callback (e.g. `useCallback` + `retry` or `router.refresh`).
 */
export function useCurriculumSync(
  programId: string | null | undefined,
  refetch: () => void | Promise<void>,
): void {
  useEffect(() => {
    if (!programId) return;
    return registerCurriculumSyncHandler(programId, refetch);
  }, [programId, refetch]);
}
