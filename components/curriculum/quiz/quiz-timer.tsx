"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type QuizTimerProps = {
  expiresAt: string;
  onExpire?: () => void;
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function QuizTimer({ expiresAt, onExpire }: QuizTimerProps) {
  const [remainingMs, setRemainingMs] = useState(() => {
    return new Date(expiresAt).getTime() - Date.now();
  });

  useEffect(() => {
    const tick = () => {
      const next = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(next);
      if (next <= 0) {
        onExpire?.();
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isUrgent = remainingMs <= 5 * 60 * 1000;
  const isExpired = remainingMs <= 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-1.5 font-mono text-sm tabular-nums",
        isExpired
          ? "bg-destructive/10 text-destructive"
          : isUrgent
            ? "bg-learn-primary/10 text-learn-primary"
            : "bg-learn-surface-2 text-learn-muted",
      )}
      aria-live="polite"
    >
      {isExpired ? "Hết giờ" : formatRemaining(remainingMs)}
    </span>
  );
}
