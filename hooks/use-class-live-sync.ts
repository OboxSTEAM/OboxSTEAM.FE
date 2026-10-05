"use client";

import { useEffect, useRef } from "react";

import {
  registerAttendanceSyncHandler,
  registerSubmissionGradedHandler,
  registerSubmissionTurnedInHandler,
} from "@/lib/realtime/class-live-sync-bus";
import type {
  SubmissionGradedSync,
  SubmissionTurnedInSync,
} from "@/lib/realtime/sync-event";

/**
 * Refetch attendance when `attendance.changed` targets the session this screen holds.
 * No-ops until both the class and session are known — the event payload has no classId.
 */
export function useAttendanceSync(
  classId: string | null | undefined,
  sessionId: string | null | undefined,
  refetch: () => void | Promise<void>,
): void {
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  });

  useEffect(() => {
    if (!classId || !sessionId) return;
    return registerAttendanceSyncHandler(sessionId, () => refetchRef.current());
  }, [classId, sessionId]);
}

/**
 * Refetch mentor assignment progress when `submission.turnedIn` targets this class.
 * `null` means the hub reconnected and the open screen should reload its current view.
 */
export function useSubmissionTurnedInSync(
  classId: string | null | undefined,
  onSync: (event: SubmissionTurnedInSync | null) => void | Promise<void>,
): void {
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  });

  useEffect(() => {
    if (!classId) return;
    return registerSubmissionTurnedInHandler(classId, (event) =>
      onSyncRef.current(event),
    );
  }, [classId]);
}

/**
 * Refetch the student's open assignment when `submission.graded` targets it.
 * `null` means the hub reconnected and the screen should reload its submission.
 */
export function useSubmissionGradedSync(
  assignmentId: string | null | undefined,
  onSync: (event: SubmissionGradedSync | null) => void | Promise<void>,
): void {
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  });

  useEffect(() => {
    if (!assignmentId) return;
    return registerSubmissionGradedHandler(assignmentId, (event) =>
      onSyncRef.current(event),
    );
  }, [assignmentId]);
}
