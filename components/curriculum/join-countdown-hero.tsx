"use client";

import {
  formatJoinCountdown,
  getJoinCountdownParts,
} from "@/lib/classes/session-helpers";

import {
  joinCountdownCellClass,
  joinCountdownColonClass,
  joinCountdownHeroClass,
  joinCountdownHintClass,
  joinCountdownNumberClass,
  joinCountdownTitleClass,
  joinCountdownUnitLabelClass,
  type SessionJoinVariant,
} from "./session-join-styles";

type JoinCountdownHeroProps = {
  ms: number;
  title: string;
  hint: string;
  tone: "locked" | "soon";
  /** `learn` = inside `.learn-shell`; `app` = mentor/manager surfaces */
  variant?: SessionJoinVariant;
};

/** Shared day/hour/minute/second countdown — used for LiveOnline and Offline sessions. */
export function JoinCountdownHero({
  ms,
  title,
  hint,
  tone,
  variant = "learn",
}: JoinCountdownHeroProps) {
  const parts = getJoinCountdownParts(ms);
  const units = [
    ...(parts.days > 0 ? [{ label: "Ngày", value: parts.days }] : []),
    { label: "Giờ", value: parts.hours },
    { label: "Phút", value: parts.minutes },
    { label: "Giây", value: parts.seconds },
  ];

  return (
    <div className={joinCountdownHeroClass(variant, tone)}>
      <p className={joinCountdownTitleClass(variant)}>{title}</p>
      <div
        className="mt-4 flex items-stretch justify-center gap-2 sm:gap-3"
        aria-live="polite"
        aria-atomic="true"
        aria-label={formatJoinCountdown(ms)}
      >
        {units.map((unit, index) => (
          <div key={unit.label} className="flex items-stretch gap-2 sm:gap-3">
            {index > 0 ? (
              <span className={joinCountdownColonClass(variant)} aria-hidden>
                :
              </span>
            ) : null}
            <div className="min-w-[4.25rem] flex-1 sm:min-w-[5rem]">
              <div className={joinCountdownCellClass(variant, tone)}>
                <p className={joinCountdownNumberClass(variant)}>
                  {String(unit.value).padStart(2, "0")}
                </p>
              </div>
              <p className={joinCountdownUnitLabelClass(variant)}>{unit.label}</p>
            </div>
          </div>
        ))}
      </div>
      <p className={joinCountdownHintClass(variant)}>{hint}</p>
    </div>
  );
}
