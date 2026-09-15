"use client";

import { useEffect, useRef, type RefObject } from "react";

function readMs(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Replays `.is-shaking` on the shake target when `error` appears/changes,
 * or when `replayKey` increments (same message, another failed submit).
 * Parent should keep `.is-error` on wrap + target while `error` is set (RHF).
 */
export function useAuthErrorShake(
  shakeTargetRef: RefObject<HTMLElement | null>,
  error?: string,
  replayKey = 0,
) {
  const previousErrorRef = useRef<string | undefined>(undefined);
  const previousKeyRef = useRef(0);

  useEffect(() => {
    const target = shakeTargetRef.current;
    if (!target) return;

    if (!error) {
      target.classList.remove("is-shaking");
      previousErrorRef.current = undefined;
      previousKeyRef.current = replayKey;
      return;
    }

    const shouldShake =
      previousErrorRef.current !== error || previousKeyRef.current !== replayKey;
    previousErrorRef.current = error;
    previousKeyRef.current = replayKey;
    if (!shouldShake) return;

    target.classList.remove("is-shaking");
    void target.offsetWidth;
    target.classList.add("is-shaking");

    const shakeMs =
      readMs("--shake-dur-a", 80) * 2 + readMs("--shake-dur-b", 60) * 2;
    const timer = window.setTimeout(() => {
      target.classList.remove("is-shaking");
    }, shakeMs + 20);

    return () => window.clearTimeout(timer);
  }, [error, replayKey, shakeTargetRef]);
}
