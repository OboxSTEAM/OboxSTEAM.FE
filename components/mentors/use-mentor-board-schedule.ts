"use client";

import { useMemo } from "react";

import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClasses,
  getClassWithSessions,
  getMyMentorProfile,
  type ClassSession,
  type StudentScheduleInterval,
} from "@/lib/api";
import { findBusyConflictLabel } from "@/lib/classes/schedule-conflict";
import { effectiveSessionStatus } from "@/lib/classes/session-helpers";

export type BoardClassSessions =
  | { status: "ready"; sessions: ClassSession[] }
  | { status: "error" };

/**
 * Occupied sessions from classes this mentor already teaches, plus sessions
 * for the board classes currently on screen, so apply can be blocked on overlap.
 */
export function useMentorBoardSchedule(boardClassIds: string[]) {
  const boardKey = boardClassIds.join(",");

  const {
    data: busyIntervals,
    isLoading: isBusyLoading,
    hasError: busyFailed,
  } = useClientFetch({
    fetcher: loadMentorBusyIntervals,
    deps: [],
    onError: () => undefined,
  });

  const {
    data: boardSessions,
    isLoading: isBoardSessionsLoading,
    hasError: boardSessionsFailed,
  } = useClientFetch({
    enabled: boardClassIds.length > 0,
    fetcher: () => loadClassSessions(boardClassIds),
    deps: [boardKey],
    onError: () => undefined,
  });

  const conflictByClassId = useMemo(() => {
    const map = new Map<string, string | null>();
    const busy = busyIntervals ?? [];
    if (!boardSessions) return map;
    for (const classId of boardClassIds) {
      const entry = boardSessions[classId];
      if (!entry || entry.status !== "ready" || busyFailed) {
        map.set(classId, null);
        continue;
      }
      map.set(
        classId,
        findBusyConflictLabel(entry.sessions, busy, {
          excludeClassId: classId,
        }),
      );
    }
    return map;
  }, [boardClassIds, boardSessions, busyFailed, busyIntervals]);

  function sessionsFor(classId: string): BoardClassSessions | null {
    return boardSessions?.[classId] ?? null;
  }

  function isSchedulePending(classId: string): boolean {
    if (isBusyLoading && busyIntervals == null && !busyFailed) return true;
    if (boardSessionsFailed) return false;
    if (isBoardSessionsLoading && boardSessions?.[classId] == null) return true;
    return false;
  }

  return {
    busyIntervals: busyFailed ? null : (busyIntervals ?? []),
    conflictByClassId,
    sessionsFor,
    isSchedulePending,
    scheduleUnavailable: (classId: string) =>
      busyFailed ||
      boardSessionsFailed ||
      boardSessions?.[classId]?.status === "error",
  };
}

async function loadMentorBusyIntervals(): Promise<StudentScheduleInterval[]> {
  const profile = await getMyMentorProfile();
  const mentorId = profile?.data?.id;
  if (!mentorId) return [];

  const classesResult = await getClasses({
    mentorId,
    page: 1,
    pageSize: 100,
    sortBy: "startDate",
    isDescending: false,
  });
  const classes = classesResult?.data?.items ?? [];
  const sessionsByClass = await loadClassSessions(classes.map((item) => item.id));
  const everyClassFailed =
    classes.length > 0 &&
    classes.every((item) => sessionsByClass[item.id]?.status === "error");
  if (everyClassFailed) {
    throw new Error("Không tải được lịch dạy hiện tại.");
  }

  return classes.flatMap((item) => {
    const loaded = sessionsByClass[item.id];
    if (!loaded || loaded.status !== "ready") return [];
    return loaded.sessions.map(
      (session): StudentScheduleInterval => ({
        classSessionId: session.id,
        classId: item.id,
        classCode: item.code?.trim() || null,
        className: item.name?.trim() || null,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionKind: session.sessionKind,
        status: effectiveSessionStatus(session),
      }),
    );
  });
}

async function loadClassSessions(
  classIds: string[],
): Promise<Record<string, BoardClassSessions>> {
  const entries = await Promise.all(
    classIds.map(async (classId) => {
      try {
        const result = await getClassWithSessions(classId);
        return [
          classId,
          {
            status: "ready" as const,
            sessions: result?.data?.sessions ?? [],
          },
        ] as const;
      } catch {
        return [classId, { status: "error" as const }] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
