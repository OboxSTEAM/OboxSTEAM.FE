import { showAppSuccess } from "@/lib/errors";
import type { SyncEvent } from "@/lib/realtime/sync-event";
import {
  isCurriculumStructureChanged,
  parseActivityProgressChanged,
  parseSubmissionGraded,
} from "@/lib/realtime/sync-event";

type CurriculumSyncHandler = () => void | Promise<void>;

const CURRICULUM_SYNC_DEBOUNCE_MS = 2_000;
/** Progress and grading hints — the student is waiting on screen. */
const CURRICULUM_PROGRESS_SYNC_MS = 300;
const CURRICULUM_SYNC_TOAST_ID = "curriculum-structure-sync";

type PendingSync = {
  timer: ReturnType<typeof setTimeout>;
  dueAt: number;
  showToast: boolean;
};

const handlersByProgramId = new Map<string, Set<CurriculumSyncHandler>>();
const pendingByProgramId = new Map<string, PendingSync>();

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

/** True while a screen for this program is mounted and handles its own sync UI. */
export function hasCurriculumSyncHandlers(
  programId: string | null | undefined,
): boolean {
  if (!programId) return false;
  return (handlersByProgramId.get(programId)?.size ?? 0) > 0;
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

/** Dispatch hub `syncEvent` to registered screens (debounced per program). */
export function dispatchCurriculumSyncEvent(event: SyncEvent): void {
  if (isCurriculumStructureChanged(event)) {
    requestCurriculumSync(event.entityId, { showToast: true });
    return;
  }

  const progress = parseActivityProgressChanged(event);
  if (progress) {
    requestCurriculumSync(progress.programId, {
      delayMs: CURRICULUM_PROGRESS_SYNC_MS,
    });
    return;
  }

  const graded = parseSubmissionGraded(event);
  if (graded) {
    requestCurriculumSync(graded.programId, {
      delayMs: CURRICULUM_PROGRESS_SYNC_MS,
    });
  }
}

/**
 * Soft sync from related notifications (e.g. MaterialUpdated) when BE does not
 * emit `curriculum.structureChanged`. Shares one debounce bucket per program;
 * a pending earlier deadline is kept so slow hints never postpone fast ones.
 */
export function requestCurriculumSync(
  programId: string,
  options?: { showToast?: boolean; delayMs?: number },
): void {
  if (!programId || !handlersByProgramId.get(programId)?.size) return;

  const delayMs = options?.delayMs ?? CURRICULUM_SYNC_DEBOUNCE_MS;
  const existing = pendingByProgramId.get(programId);
  const showToast = options?.showToast === true || existing?.showToast === true;
  const now = Date.now();
  const dueAt = existing ? Math.min(existing.dueAt, now + delayMs) : now + delayMs;

  if (existing) clearTimeout(existing.timer);

  pendingByProgramId.set(programId, {
    dueAt,
    showToast,
    timer: setTimeout(() => {
      pendingByProgramId.delete(programId);
      runProgramHandlers(programId, showToast);
    }, Math.max(0, dueAt - now)),
  });
}

/**
 * After SignalR reconnect, re-run every registered handler so screens catch
 * structure changes missed while offline. No toast (may refetch many programs).
 */
export function flushAllCurriculumSyncHandlers(): void {
  for (const pending of pendingByProgramId.values()) {
    clearTimeout(pending.timer);
  }
  pendingByProgramId.clear();

  for (const programId of handlersByProgramId.keys()) {
    runProgramHandlers(programId, false);
  }
}
