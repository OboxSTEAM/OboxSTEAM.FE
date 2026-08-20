import type { SyncEvent } from "@/lib/realtime/sync-event";
import { isCurriculumStructureChanged } from "@/lib/realtime/sync-event";

type CurriculumSyncHandler = () => void | Promise<void>;

const handlersByProgramId = new Map<string, Set<CurriculumSyncHandler>>();

/** Register a silent refetch handler for a program-bound screen. */
export function registerCurriculumSyncHandler(
  programId: string,
  handler: CurriculumSyncHandler,
): () => void {
  const bucket =
    handlersByProgramId.get(programId) ?? new Set<CurriculumSyncHandler>();
  bucket.add(handler);
  handlersByProgramId.set(programId, bucket);

  return () => {
    const current = handlersByProgramId.get(programId);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) {
      handlersByProgramId.delete(programId);
    }
  };
}

/** Dispatch hub `syncEvent` to registered screens — never shows UI. */
export function dispatchCurriculumSyncEvent(event: SyncEvent): void {
  if (!isCurriculumStructureChanged(event)) return;

  const handlers = handlersByProgramId.get(event.entityId);
  if (!handlers?.size) return;

  for (const handler of handlers) {
    void Promise.resolve(handler()).catch(() => {
      /* Refetch failures stay on-screen; no toast for sync hints. */
    });
  }
}
