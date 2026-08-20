"use client";

import { useEffect, useRef } from "react";

import { registerCurriculumSyncHandler } from "@/lib/realtime/curriculum-sync-bus";
import {
  isCurriculumStructureChanged,
  type SyncEvent,
} from "@/lib/realtime/sync-event";

export type SyncEventFilter = (event: SyncEvent) => boolean;

/**
 * Subscribe to curriculum structure sync for one or more program ids.
 * Prefer this (or `useCurriculumSync`) over listening to the hub directly —
 * the notification provider already owns the SignalR connection.
 */
export function useSyncEvent(
  programIds: string | string[] | null | undefined,
  onSync: () => void | Promise<void>,
  filter: SyncEventFilter = isCurriculumStructureChanged,
): void {
  const onSyncRef = useRef(onSync);
  const filterRef = useRef(filter);
  onSyncRef.current = onSync;
  filterRef.current = filter;

  const ids = normalizeProgramIds(programIds);

  useEffect(() => {
    if (ids.length === 0) return;

    const handler = () => onSyncRef.current();
    const unsubscribers = ids.map((programId) =>
      registerCurriculumSyncHandler(programId, () => {
        // Bus already filters curriculum.structureChanged; keep filter hook
        // for future non-curriculum scopes when the bus expands.
        const synthetic: SyncEvent = {
          scope: "curriculum.structureChanged",
          entityType: "Program",
          entityId: programId,
          at: new Date().toISOString(),
        };
        if (!filterRef.current(synthetic)) return;
        return handler();
      }),
    );

    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [ids.join("|")]);
}

function normalizeProgramIds(
  programIds: string | string[] | null | undefined,
): string[] {
  if (!programIds) return [];
  const list = Array.isArray(programIds) ? programIds : [programIds];
  return [...new Set(list.filter(Boolean))];
}
