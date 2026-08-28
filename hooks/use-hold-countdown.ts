"use client";

import { useEffect, useState } from "react";

import { getHoldRemainingMs } from "@/lib/payment/seat-hold";

function getRemainingMs(expiresAt: string | null | undefined, now: number): number {
  return getHoldRemainingMs(expiresAt, now);
}

export function formatHoldCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Live countdown until `holdExpiresAt` (ISO string). */
export function useHoldCountdown(holdExpiresAt: string | null | undefined): {
  remainingMs: number;
  isExpired: boolean;
  label: string;
} {
  const [remainingMs, setRemainingMs] = useState(() =>
    getRemainingMs(holdExpiresAt, Date.now()),
  );

  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingMs(0);
      return;
    }

    const tick = () => {
      setRemainingMs(getRemainingMs(holdExpiresAt, Date.now()));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [holdExpiresAt]);

  return {
    remainingMs,
    isExpired: remainingMs <= 0,
    label: formatHoldCountdown(remainingMs),
  };
}
