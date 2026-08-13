"use client";

import { cn } from "@/lib/utils";

type AttemptQuotaPillProps = {
  attemptNumber: number;
  maxAttempts: number;
  className?: string;
};

/**
 * Single compact attempt meter — `3/5`. Tone shifts when exhausted.
 * Use once per panel header; do not repeat in footers/result copy.
 */
export function AttemptQuotaPill({
  attemptNumber,
  maxAttempts,
  className,
}: AttemptQuotaPillProps) {
  const safeMax = Math.max(1, maxAttempts);
  const safeCurrent = Math.min(Math.max(0, attemptNumber), safeMax);
  const isExhausted = safeCurrent >= safeMax;

  return (
    <span
      title={`Lượt ${safeCurrent}/${safeMax}`}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-0.5 rounded-md px-1.5 font-mono text-[11px] font-semibold tabular-nums tracking-tight",
        isExhausted
          ? "bg-learn-primary/12 text-learn-primary"
          : "bg-learn-surface-2 text-learn-muted",
        className,
      )}
    >
      <span className="text-learn-text-strong">{safeCurrent}</span>
      <span className="opacity-40">/</span>
      <span>{safeMax}</span>
    </span>
  );
}
