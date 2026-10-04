"use client";

import { useEffect, useRef } from "react";

import {
  registerAttendanceSyncHandler,
  registerSubmissionTurnedInHandler,
} from "@/lib/realtime/class-live-sync-bus";
import type { SubmissionTurnedInSync } from "@/lib/realtime/sync-event";

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
  refetchRef.current = refetch;

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
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!classId) return;
    return registerSubmissionTurnedInHandler(classId, (event) =>
      onSyncRef.current(event),
    );
  }, [classId]);
}
