"use client";

import {
  formatJoinCountdown,
  getJoinCountdownParts,
} from "@/lib/classes/session-helpers";
import { cn } from "@/lib/utils";

type JoinCountdownHeroProps = {
  ms: number;
  title: string;
  hint: string;
  tone: "locked" | "soon";
};

/** Shared day/hour/minute/second countdown — used for LiveOnline and Offline sessions. */
export function JoinCountdownHero({
  ms,
  title,
  hint,
  tone,
}: JoinCountdownHeroProps) {
  const parts = getJoinCountdownParts(ms);
  const units = [
    ...(parts.days > 0 ? [{ label: "Ngày", value: parts.days }] : []),
    { label: "Giờ", value: parts.hours },
    { label: "Phút", value: parts.minutes },
    { label: "Giây", value: parts.seconds },
  ];
  const isSoon = tone === "soon";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border px-4 py-5 sm:px-5",
        isSoon
          ? "border-learn-accent/40 bg-learn-accent/10"
          : "border-learn-accent/25 bg-learn-surface",
      )}
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-learn-muted">
        {title}
      </p>
      <div
        className="mt-4 flex items-stretch justify-center gap-2 sm:gap-3"
        aria-live="polite"
        aria-atomic="true"
        aria-label={formatJoinCountdown(ms)}
      >
        {units.map((unit, index) => (
          <div key={unit.label} className="flex items-stretch gap-2 sm:gap-3">
            {index > 0 ? (
              <span
                className="hidden self-center font-heading text-2xl font-extrabold text-learn-faint sm:inline"
                aria-hidden
              >
                :
              </span>
            ) : null}
            <div className="min-w-[4.25rem] flex-1 sm:min-w-[5rem]">
              <div
                className={cn(
                  "rounded-2xl border px-2 py-3 text-center sm:px-3 sm:py-4",
                  isSoon
                    ? "border-learn-accent/30 bg-learn-surface shadow-[0_8px_24px_rgba(79,195,247,0.18)]"
                    : "border-learn-border bg-learn-surface-2",
                )}
              >
                <p className="font-heading text-3xl font-extrabold tabular-nums leading-none tracking-tight text-learn-text-strong sm:text-4xl">
                  {String(unit.value).padStart(2, "0")}
                </p>
              </div>
              <p className="mt-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-learn-muted">
                {unit.label}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-learn-muted">{hint}</p>
    </div>
  );
}
