import { showAppSuccess } from "@/lib/errors";
import type { SyncEvent } from "@/lib/realtime/sync-event";
import { isCurriculumStructureChanged } from "@/lib/realtime/sync-event";

type CurriculumSyncHandler = () => void | Promise<void>;

const CURRICULUM_SYNC_DEBOUNCE_MS = 2_000;
const CURRICULUM_SYNC_TOAST_ID = "curriculum-structure-sync";

const handlersByProgramId = new Map<string, Set<CurriculumSyncHandler>>();
const debounceTimersByProgramId = new Map<
  string,
  ReturnType<typeof setTimeout>
>();

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

function runProgramHandlers(programId: string, showToast: boolean): void {
  const handlers = handlersByProgramId.get(programId);
  if (!handlers?.size) return;

  for (const handler of handlers) {
    void Promise.resolve(handler()).catch(() => {
      /* Refetch failures stay on-screen; sync hints are best-effort. */
    });
  }

  if (showToast) {
    showAppSuccess(
      {
        title: "Nội dung vừa được cập nhật",
        description: "Cây chương trình đã đồng bộ lại từ máy chủ.",
      },
      { id: CURRICULUM_SYNC_TOAST_ID, duration: 3500 },
    );
  }
}

/** Dispatch hub `syncEvent` to registered screens (debounced 2s per program). */
export function dispatchCurriculumSyncEvent(event: SyncEvent): void {
  if (!isCurriculumStructureChanged(event)) return;

  const programId = event.entityId;
  if (!handlersByProgramId.get(programId)?.size) return;

  const existing = debounceTimersByProgramId.get(programId);
  if (existing) clearTimeout(existing);

  debounceTimersByProgramId.set(
    programId,
    setTimeout(() => {
      debounceTimersByProgramId.delete(programId);
      runProgramHandlers(programId, true);
    }, CURRICULUM_SYNC_DEBOUNCE_MS),
  );
}

/**
 * After SignalR reconnect, re-run every registered handler so screens catch
 * structure changes missed while offline. No toast (may refetch many programs).
 */
export function flushAllCurriculumSyncHandlers(): void {
  for (const timer of debounceTimersByProgramId.values()) {
    clearTimeout(timer);
  }
  debounceTimersByProgramId.clear();

  for (const programId of handlersByProgramId.keys()) {
    runProgramHandlers(programId, false);
  }
}
