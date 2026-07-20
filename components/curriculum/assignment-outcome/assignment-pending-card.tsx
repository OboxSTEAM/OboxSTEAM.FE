"use client";

import type { AssignmentPendingCardModel } from "@/lib/curriculum/assignment-outcome";
import { cn } from "@/lib/utils";

import { AssignmentStatusPill, Hourglass } from "./assignment-status-pill";

type AssignmentPendingCardProps = AssignmentPendingCardModel & {
  className?: string;
};

export function AssignmentPendingCard({
  summary,
  submittedLabel,
  className,
}: AssignmentPendingCardProps) {
  return (
    <div className={cn("max-w-md space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <AssignmentStatusPill tone="info" icon={Hourglass}>
          Đã nộp — chờ chấm điểm
        </AssignmentStatusPill>
        {submittedLabel ? (
          <span className="text-sm text-learn-muted">Nộp lúc {submittedLabel}</span>
        ) : null}
      </div>
      {summary ? <p className="text-sm text-learn-muted">{summary}</p> : null}
    </div>
  );
}
