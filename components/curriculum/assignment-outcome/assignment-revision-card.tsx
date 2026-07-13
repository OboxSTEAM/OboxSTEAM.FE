"use client";

import type { AssignmentRevisionCardModel } from "@/lib/curriculum/assignment-outcome";
import { cn } from "@/lib/utils";

import { AssignmentStatusPill, RotateCcw } from "./assignment-status-pill";

type AssignmentRevisionCardProps = AssignmentRevisionCardModel & {
  className?: string;
};

export function AssignmentRevisionCard({
  feedback,
  className,
}: AssignmentRevisionCardProps) {
  return (
    <div
      className={cn(
        "max-w-md rounded-xl border border-learn-primary/25 bg-learn-primary/5 p-3.5",
        className,
      )}
    >
      <AssignmentStatusPill tone="warn" icon={RotateCcw}>
        Cần chỉnh sửa
      </AssignmentStatusPill>
      {feedback ? (
        <p className="mt-2.5 text-sm leading-relaxed text-learn-muted">{feedback}</p>
      ) : null}
    </div>
  );
}
