"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getDiscussionPins, type DiscussionMessage } from "@/lib/api";
import { registerAdvisorySyncHandler } from "@/lib/realtime/advisory-sync-bus";

const PINS_REFRESH_DEBOUNCE_MS = 250;

type PinsSnapshot = { programId: string; pins: DiscussionMessage[] };
type PinsFailure = { programId: string; error: unknown };

export type UseDiscussionPinsResult = {
  /** Pinned messages, oldest first. */
  pins: DiscussionMessage[];
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
  /** Apply a message returned by a pin mutation (removed when `pin` is null or deleted). */
  applyPinnedMessage: (message: DiscussionMessage) => void;
};

/** "Cần sửa" list for one program; refetches on pin changes, edits/deletes and reconnects. */
export function useDiscussionPins(
  programId: string,
  options: { enabled?: boolean } = {},
): UseDiscussionPinsResult {
  const { enabled = true } = options;
  const isActive = enabled && Boolean(programId);

  const [snapshot, setSnapshot] = useState<PinsSnapshot | null>(null);
  const [failure, setFailure] = useState<PinsFailure | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pins = useMemo(
    () => (snapshot?.programId === programId ? snapshot.pins : []),
    [programId, snapshot],
  );
  const error = failure?.programId === programId ? failure.error : null;
  const isLoading = isActive && snapshot?.programId !== programId && error === null;

  const refresh = useCallback((): Promise<void> => {
    if (!isActive) return Promise.resolve();
    const requestId = ++requestIdRef.current;
    return getDiscussionPins(programId).then(
      (next) => {
        if (requestId !== requestIdRef.current) return;
        setSnapshot({ programId, pins: [...next].sort((a, b) => a.sequence - b.sequence) });
        setFailure(null);
      },
      (caught: unknown) => {
        if (requestId === requestIdRef.current) setFailure({ programId, error: caught });
      },
    );
  }, [isActive, programId]);

  const applyPinnedMessage = useCallback(
    (message: DiscussionMessage) => {
      requestIdRef.current += 1;
      setSnapshot((prev) => {
        const base = prev?.programId === programId ? prev.pins : [];
        const rest = base.filter((item) => item.id !== message.id);
        const next =
          message.pin && !message.isDeleted
            ? [...rest, message].sort((a, b) => a.sequence - b.sequence)
            : rest;
        return { programId, pins: next };
      });
    },
    [programId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isActive) return;
    const unsubscribe = registerAdvisorySyncHandler(programId, (signal) => {
      const isRelevant =
        signal.scope === "advisory.pinChanged" ||
        signal.scope === "resync" ||
        (signal.scope === "advisory.discussionChanged" && signal.payload.messageId !== null);
      if (!isRelevant) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void refresh();
      }, PINS_REFRESH_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [isActive, programId, refresh]);

  return { pins, isLoading, error, refresh, applyPinnedMessage };
}
