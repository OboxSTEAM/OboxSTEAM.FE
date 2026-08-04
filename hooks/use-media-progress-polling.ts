"use client";

import { useEffect, useRef, useState } from "react";

import { getMediaProgress, type MediaProgress, type MediaVideoStatus } from "@/lib/api";

/** Poll while MediaConvert is running. */
export const MEDIA_TRANSCODE_POLL_MS = 2000;
/** Slower poll while Rekognition / tagging runs. */
export const MEDIA_TAGGING_POLL_MS = 4000;
/** Safety cap — stop polling stuck jobs (~20 minutes). */
export const MEDIA_PROGRESS_MAX_DURATION_MS = 20 * 60 * 1000;

export type MediaProgressPollTarget = {
  id: string;
  videoStatus: MediaVideoStatus;
  isReady: boolean;
};

function isTerminalProgress(progress: MediaProgress): boolean {
  return (
    progress.isReady ||
    progress.isFailed ||
    progress.videoStatus === "TaggingComplete" ||
    progress.videoStatus === "Failed"
  );
}

function shouldPollTarget(target: MediaProgressPollTarget): boolean {
  if (target.isReady) return false;
  return (
    target.videoStatus === "Transcoding" ||
    target.videoStatus === "PendingTagging"
  );
}

function pollIntervalForStatus(status: MediaVideoStatus): number {
  if (status === "PendingTagging") return MEDIA_TAGGING_POLL_MS;
  return MEDIA_TRANSCODE_POLL_MS;
}

type UseMediaProgressPollingOptions = {
  targets: MediaProgressPollTarget[];
  enabled?: boolean;
  onTerminal?: (mediaId: string, progress: MediaProgress) => void;
  onTimedOut?: (mediaId: string) => void;
};

/**
 * Gallery-optimized progress polling:
 * - Transcoding / just-uploaded: every 2s via GET /api/media/{id}/progress
 * - PendingTagging: every 4s
 * - Stops on ready / failed / TaggingComplete; caps at ~20 minutes
 */
export function useMediaProgressPolling({
  targets,
  enabled = true,
  onTerminal,
  onTimedOut,
}: UseMediaProgressPollingOptions) {
  const [progressById, setProgressById] = useState<Record<string, MediaProgress>>(
    {},
  );
  const [timedOutIds, setTimedOutIds] = useState<Record<string, true>>({});

  const progressByIdRef = useRef(progressById);
  progressByIdRef.current = progressById;

  const startedAtRef = useRef<Map<string, number>>(new Map());
  const lastPollAtRef = useRef<Map<string, number>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());
  const terminalNotifiedRef = useRef<Set<string>>(new Set());
  const onTerminalRef = useRef(onTerminal);
  const onTimedOutRef = useRef(onTimedOut);
  onTerminalRef.current = onTerminal;
  onTimedOutRef.current = onTimedOut;

  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  const targetsKey = targets
    .map((t) => `${t.id}:${t.videoStatus}:${t.isReady ? 1 : 0}`)
    .sort()
    .join("|");

  useEffect(() => {
    if (!enabled) return;

    const active = targetsRef.current.filter(shouldPollTarget);
    const activeIds = new Set(active.map((t) => t.id));

    for (const target of active) {
      if (!startedAtRef.current.has(target.id)) {
        startedAtRef.current.set(target.id, Date.now());
      }
    }

    for (const id of [...startedAtRef.current.keys()]) {
      if (!activeIds.has(id)) {
        startedAtRef.current.delete(id);
        lastPollAtRef.current.delete(id);
        inFlightRef.current.delete(id);
      }
    }

    if (active.length === 0) return;

    let cancelled = false;

    async function pollTarget(target: MediaProgressPollTarget) {
      if (cancelled || inFlightRef.current.has(target.id)) return;

      const startedAt = startedAtRef.current.get(target.id) ?? Date.now();
      if (Date.now() - startedAt >= MEDIA_PROGRESS_MAX_DURATION_MS) {
        setTimedOutIds((prev) =>
          prev[target.id] ? prev : { ...prev, [target.id]: true },
        );
        onTimedOutRef.current?.(target.id);
        startedAtRef.current.delete(target.id);
        return;
      }

      const known = progressByIdRef.current[target.id];
      const status = known?.videoStatus ?? target.videoStatus;
      const interval = pollIntervalForStatus(status);
      const last = lastPollAtRef.current.get(target.id) ?? 0;
      if (Date.now() - last < interval) return;

      inFlightRef.current.add(target.id);
      lastPollAtRef.current.set(target.id, Date.now());

      try {
        const result = await getMediaProgress(target.id);
        const progress = result?.data;
        if (!progress || cancelled) return;

        setProgressById((prev) => ({ ...prev, [target.id]: progress }));

        if (
          isTerminalProgress(progress) &&
          !terminalNotifiedRef.current.has(target.id)
        ) {
          terminalNotifiedRef.current.add(target.id);
          onTerminalRef.current?.(target.id, progress);
        }
      } catch {
        // Keep polling until timeout.
      } finally {
        inFlightRef.current.delete(target.id);
      }
    }

    async function tick() {
      const current = targetsRef.current.filter(shouldPollTarget);
      await Promise.all(current.map((target) => pollTarget(target)));
    }

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, targetsKey]);

  return { progressById, timedOutIds };
}
