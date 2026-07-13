"use client";

import { CheckCircle2, Circle, ClipboardList, Lock } from "lucide-react";

import type { EnrollmentCurriculumAssignment } from "@/lib/api";
import {
  ASSIGNMENT_STATUS_META,
  ASSIGNMENT_TITLE_PREFIX,
} from "@/lib/curriculum/constants";
import { cn } from "@/lib/utils";

type CurriculumNavAssignmentItemProps = {
  assignment: EnrollmentCurriculumAssignment;
  isSelected?: boolean;
  onSelect?: (assignmentId: string) => void;
  inTree?: boolean;
};

function StatusIcon({
  status,
}: {
  status: EnrollmentCurriculumAssignment["status"];
}) {
  const meta = ASSIGNMENT_STATUS_META[status];

  if (meta.icon === "check") {
    return (
      <CheckCircle2
        className="size-4 shrink-0 text-learn-success"
        aria-hidden
      />
    );
  }

  if (meta.icon === "locked") {
    return <Lock className="size-4 shrink-0 text-learn-faint/70" aria-hidden />;
  }

  if (meta.icon === "pending") {
    return (
      <ClipboardList className="size-4 shrink-0 text-learn-accent" aria-hidden />
    );
  }

  return <Circle className="size-4 shrink-0 text-learn-faint" aria-hidden />;
}

export function CurriculumNavAssignmentItem({
  assignment,
  isSelected = false,
  onSelect,
  inTree = false,
}: CurriculumNavAssignmentItemProps) {
  const isLocked = assignment.status === "locked";
  const prefix = ASSIGNMENT_TITLE_PREFIX[assignment.assignmentType];

  if (isLocked || !onSelect) {
    return (
      <div
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 rounded-lg text-left text-sm",
          inTree ? "px-2 py-2" : "px-3 py-2.5",
          "cursor-not-allowed opacity-50",
        )}
        aria-disabled
      >
        <StatusIcon status={assignment.status} />
        <span className="min-w-0 leading-snug">
          <span className="text-learn-faint">{prefix}: </span>
          {assignment.title}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(assignment.assignmentId)}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-lg text-left text-sm transition-colors",
        inTree ? "px-2 py-2" : "px-3 py-2.5",
        isSelected && "bg-learn-surface font-medium text-learn-text-strong",
        !isSelected && "text-learn-muted hover:bg-learn-surface/80",
      )}
      aria-current={isSelected ? "page" : undefined}
    >
      <StatusIcon status={assignment.status} />
      <span className="min-w-0 leading-snug">
        <span className="text-learn-faint">{prefix}: </span>
        {assignment.title}
      </span>
    </button>
  );
}
