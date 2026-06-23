"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  SCROLL_COMPLETE_EPSILON,
  VIDEO_COMPLETE_EPSILON_SECONDS,
} from "@/lib/curriculum/constants";

export type CompletionGateKind = "video" | "pdf" | "doc" | "manual" | "session";

export type UseActivityCompletionGateOptions = {
  kind: CompletionGateKind;
  /** When true, activity is already marked done on the server. */
  isAlreadyComplete?: boolean;
};

export type UseActivityCompletionGateResult = {
  canComplete: boolean;
  onVideoTimeUpdate: (currentTime: number, duration: number) => void;
  onVideoEnded: () => void;
  onScrollProgress: (scrollRatio: number) => void;
  markManualComplete: () => void;
};

export function useActivityCompletionGate({
  kind,
  isAlreadyComplete = false,
}: UseActivityCompletionGateOptions): UseActivityCompletionGateResult {
  const [canComplete, setCanComplete] = useState(
    isAlreadyComplete || kind === "manual" || kind === "session",
  );

  useEffect(() => {
    setCanComplete(isAlreadyComplete || kind === "manual" || kind === "session");
  }, [isAlreadyComplete, kind]);

  const onVideoTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (kind !== "video" || !Number.isFinite(duration) || duration <= 0) return;
    if (currentTime >= duration - VIDEO_COMPLETE_EPSILON_SECONDS) {
      setCanComplete(true);
    }
  }, [kind]);

  const onVideoEnded = useCallback(() => {
    if (kind === "video") {
      setCanComplete(true);
    }
  }, [kind]);

  const onScrollProgress = useCallback((scrollRatio: number) => {
    if (kind !== "pdf" && kind !== "doc") return;
    if (scrollRatio >= 1 - SCROLL_COMPLETE_EPSILON) {
      setCanComplete(true);
    }
  }, [kind]);

  const markManualComplete = useCallback(() => {
    setCanComplete(true);
  }, []);

  return {
    canComplete,
    onVideoTimeUpdate,
    onVideoEnded,
    onScrollProgress,
    markManualComplete,
  };
}

export function useDebouncedCheckpoint(
  save: () => void | Promise<void>,
  delayMs: number,
): () => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void saveRef.current();
    }, delayMs);
  }, [delayMs]);
}
