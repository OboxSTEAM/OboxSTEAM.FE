import {
  parseAttendanceChanged,
  parseSubmissionGraded,
  parseSubmissionTurnedIn,
  type SubmissionGradedSync,
  type SubmissionTurnedInSync,
  type SyncEvent,
} from "@/lib/realtime/sync-event";

type AttendanceSyncHandler = () => void | Promise<void>;
/** `null` is a reconnect resync — the open screen refetches whatever it is showing. */
type SubmissionSyncHandler = (
  event: SubmissionTurnedInSync | null,
) => void | Promise<void>;
/** `null` is a reconnect resync — the open assignment refetches its submission. */
type SubmissionGradedHandler = (
  event: SubmissionGradedSync | null,
) => void | Promise<void>;

const attendanceHandlersBySessionId = new Map<string, Set<AttendanceSyncHandler>>();
const submissionHandlersByClassId = new Map<string, Set<SubmissionSyncHandler>>();
const gradedHandlersByAssignmentId = new Map<
  string,
  Set<SubmissionGradedHandler>
>();

function run<T>(handlers: Set<T> | undefined, invoke: (handler: T) => void): void {
  if (!handlers?.size) return;
  for (const handler of handlers) {
    try {
      invoke(handler);
    } catch {
      /* Refetch failures stay on-screen; sync hints are best-effort. */
    }
  }
}

/** Student screen that already holds this class session. */
export function registerAttendanceSyncHandler(
  sessionId: string,
  handler: AttendanceSyncHandler,
): () => void {
  const bucket =
    attendanceHandlersBySessionId.get(sessionId) ??
    new Set<AttendanceSyncHandler>();
  bucket.add(handler);
  attendanceHandlersBySessionId.set(sessionId, bucket);

  return () => {
    const current = attendanceHandlersBySessionId.get(sessionId);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) {
      attendanceHandlersBySessionId.delete(sessionId);
    }
  };
}

/** Mentor screen that already has this class open. */
export function registerSubmissionTurnedInHandler(
  classId: string,
  handler: SubmissionSyncHandler,
): () => void {
  const bucket =
    submissionHandlersByClassId.get(classId) ?? new Set<SubmissionSyncHandler>();
  bucket.add(handler);
  submissionHandlersByClassId.set(classId, bucket);

  return () => {
    const current = submissionHandlersByClassId.get(classId);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) {
      submissionHandlersByClassId.delete(classId);
    }
  };
}

/** Student assignment page that is showing this assignment. */
export function registerSubmissionGradedHandler(
  assignmentId: string,
  handler: SubmissionGradedHandler,
): () => void {
  const bucket =
    gradedHandlersByAssignmentId.get(assignmentId) ??
    new Set<SubmissionGradedHandler>();
  bucket.add(handler);
  gradedHandlersByAssignmentId.set(assignmentId, bucket);

  return () => {
    const current = gradedHandlersByAssignmentId.get(assignmentId);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) {
      gradedHandlersByAssignmentId.delete(assignmentId);
    }
  };
}

/** Dispatch `attendance.changed`, `submission.turnedIn` and `submission.graded`. No toast. */
export function dispatchClassLiveSyncEvent(event: SyncEvent): void {
  const attendance = parseAttendanceChanged(event);
  if (attendance) {
    const handlers = attendanceHandlersBySessionId.get(attendance.sessionId);
    run(handlers, (handler) => {
      void Promise.resolve(handler()).catch(() => {
        /* best-effort */
      });
    });
    return;
  }

  const turnedIn = parseSubmissionTurnedIn(event);
  if (turnedIn) {
    const handlers = submissionHandlersByClassId.get(turnedIn.classId);
    run(handlers, (handler) => {
      void Promise.resolve(handler(turnedIn)).catch(() => {
        /* best-effort */
      });
    });
    return;
  }

  const graded = parseSubmissionGraded(event);
  if (!graded) return;

  const handlers = gradedHandlersByAssignmentId.get(graded.assignmentId);
  run(handlers, (handler) => {
    void Promise.resolve(handler(graded)).catch(() => {
      /* best-effort */
    });
  });
}

/** Re-run open screens after reconnect so a missed hint still hits REST. */
export function flushAllClassLiveSyncHandlers(): void {
  for (const handlers of attendanceHandlersBySessionId.values()) {
    run(handlers, (handler) => {
      void Promise.resolve(handler()).catch(() => {
        /* best-effort */
      });
    });
  }

  for (const handlers of submissionHandlersByClassId.values()) {
    run(handlers, (handler) => {
      void Promise.resolve(handler(null)).catch(() => {
        /* best-effort */
      });
    });
  }

  for (const handlers of gradedHandlersByAssignmentId.values()) {
    run(handlers, (handler) => {
      void Promise.resolve(handler(null)).catch(() => {
        /* best-effort */
      });
    });
  }
}
