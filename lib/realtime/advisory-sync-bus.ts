import {
  parseAdvisorySyncEvent,
  type AdvisorySyncEvent,
  type SyncEvent,
} from "@/lib/realtime/sync-event";

/** `resync` fires after a hub reconnect — events may have been missed while offline. */
export type AdvisorySyncSignal = AdvisorySyncEvent | { scope: "resync"; programId: string };

type AdvisorySyncHandler = (signal: AdvisorySyncSignal) => void | Promise<void>;

const handlersByProgramId = new Map<string, Set<AdvisorySyncHandler>>();

function runHandlers(programId: string, signal: AdvisorySyncSignal): void {
  const handlers = handlersByProgramId.get(programId);
  if (!handlers?.size) return;

  for (const handler of handlers) {
    void Promise.resolve(handler(signal)).catch(() => {
      /* Refetch failures stay on-screen; sync hints are best-effort. */
    });
  }
}

/** Register a handler for advisory group events of one program. */
export function registerAdvisorySyncHandler(
  programId: string,
  handler: AdvisorySyncHandler,
): () => void {
  const bucket = handlersByProgramId.get(programId) ?? new Set<AdvisorySyncHandler>();
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

/** Dispatch hub `syncEvent` with an `advisory.*` scope (no debounce — chat needs it live). */
export function dispatchAdvisorySyncEvent(event: SyncEvent): void {
  const advisoryEvent = parseAdvisorySyncEvent(event);
  if (!advisoryEvent) return;
  runHandlers(advisoryEvent.programId, advisoryEvent);
}

export function flushAllAdvisorySyncHandlers(): void {
  for (const programId of handlersByProgramId.keys()) {
    runHandlers(programId, { scope: "resync", programId });
  }
}
