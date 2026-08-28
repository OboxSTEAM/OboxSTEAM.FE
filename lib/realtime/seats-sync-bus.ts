import type { SyncEvent } from "@/lib/realtime/sync-event";
import { isSeatsChanged } from "@/lib/realtime/sync-event";

type SeatsSyncHandler = () => void | Promise<void>;

const handlersByProgramId = new Map<string, Set<SeatsSyncHandler>>();

/** Register a silent refetch handler for open-class seat updates. */
export function registerSeatsSyncHandler(
  programId: string,
  handler: SeatsSyncHandler,
): () => void {
  const bucket =
    handlersByProgramId.get(programId) ?? new Set<SeatsSyncHandler>();
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

/** Dispatch hub `syncEvent` with `scope === "seats.changed"`. */
export function dispatchSeatsSyncEvent(event: SyncEvent): void {
  if (!isSeatsChanged(event)) return;

  const handlers = handlersByProgramId.get(event.entityId);
  if (!handlers?.size) return;

  for (const handler of handlers) {
    void Promise.resolve(handler()).catch(() => {
      /* Refetch failures stay on-screen; sync hints are best-effort. */
    });
  }
}

/** Re-run every registered handler after reconnect (no debounce). */
export function flushAllSeatsSyncHandlers(): void {
  for (const programId of handlersByProgramId.keys()) {
    const handlers = handlersByProgramId.get(programId);
    if (!handlers?.size) continue;
    for (const handler of handlers) {
      void Promise.resolve(handler()).catch(() => {
        /* best-effort */
      });
    }
  }
}
