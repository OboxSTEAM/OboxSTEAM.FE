"use client";

import { useSyncEvent } from "@/hooks/use-sync-event";

/**
 * Subscribe to silent curriculum sync hints for a program-bound screen.
 * Pass a stable refetch callback (e.g. `useCallback` + `retry` or `router.refresh`).
 */
export function useCurriculumSync(
  programId: string | string[] | null | undefined,
  refetch: () => void | Promise<void>,
): void {
  useSyncEvent(programId, refetch);
}
