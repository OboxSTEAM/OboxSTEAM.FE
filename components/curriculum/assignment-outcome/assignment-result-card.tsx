"use client";

import type { AssignmentResultCardModel } from "@/lib/curriculum/assignment-outcome";
import { cn } from "@/lib/utils";

import {
  AssignmentStatusPill,
  getPassFailIcon,
  getPassFailPillLabel,
  getPassFailTitle,
  getPassFailTone,
} from "./assignment-status-pill";

type AssignmentResultCardProps = AssignmentResultCardModel & {
  className?: string;
};

export function AssignmentResultCard({
  passed,
  summary,
  assignedGrade,
  maxPoints,
  details,
  mentorFeedback,
  footer,
  className,
}: AssignmentResultCardProps) {
  const percent =
    maxPoints > 0 ? Math.round((assignedGrade / maxPoints) * 100) : null;
  const PassFailIcon = getPassFailIcon(passed);

  return (
    <div className={cn("max-w-md space-y-3", className)}>
      <div className="flex items-start gap-2.5">
        <AssignmentStatusPill tone={getPassFailTone(passed)} icon={PassFailIcon}>
          {getPassFailPillLabel(passed)}
        </AssignmentStatusPill>
        <div className="min-w-0 pt-0.5">
          <p className="font-heading text-base font-semibold text-learn-text-strong">
            {getPassFailTitle(passed)}
          </p>
          {summary ? (
            <p className="mt-0.5 text-sm leading-snug text-learn-muted">{summary}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-learn-border bg-learn-surface-2 p-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-semibold tabular-nums text-learn-text-strong">
              {assignedGrade}
            </span>
            <span className="text-sm text-learn-muted">/ {maxPoints}</span>
          </span>
          {percent != null ? (
            <span
              className={cn(
                "ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                passed
                  ? "bg-learn-success/15 text-learn-success"
                  : "bg-learn-primary/10 text-learn-primary",
              )}
            >
              {percent}%
            </span>
          ) : null}
        </div>

        {details.length > 0 ? (
          <dl className="mt-3 space-y-1.5 border-t border-learn-border pt-3 text-xs">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-center justify-between gap-4">
                <dt className="text-learn-muted">{detail.label}</dt>
                <dd className="font-medium text-learn-text-strong">{detail.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {mentorFeedback ? (
          <p className="mt-3 border-t border-learn-border pt-3 text-sm leading-relaxed text-learn-muted">
            <span className="font-medium text-learn-text-strong">Nhận xét: </span>
            {mentorFeedback}
          </p>
        ) : null}
      </div>

      {footer ? <p className="text-xs text-learn-faint">{footer}</p> : null}
    </div>
  );
}
