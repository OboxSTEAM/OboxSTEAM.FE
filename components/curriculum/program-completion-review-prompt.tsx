"use client";

import { useState } from "react";

import { ProgramReviewDialog } from "@/components/programs/reviews/program-review-dialog";
import { useMyProgramReview } from "@/hooks/use-my-program-review";
import type { ProgramEnrollment } from "@/lib/api/program-enrollments";

const DISMISS_KEY_PREFIX = "obox:review-prompt-dismissed:";

function isPromptDismissed(enrollmentId: string): boolean {
  try {
    return window.localStorage.getItem(`${DISMISS_KEY_PREFIX}${enrollmentId}`) === "1";
  } catch {
    return false;
  }
}

function markPromptDismissed(enrollmentId: string): void {
  try {
    window.localStorage.setItem(`${DISMISS_KEY_PREFIX}${enrollmentId}`, "1");
  } catch {
    // Private mode / quota — prompt may reappear next visit; acceptable.
  }
}

type ProgramCompletionReviewPromptProps = {
  programId: string;
  enrollment: ProgramEnrollment;
};

/** One-time review dialog on the learn page once the enrollment is Completed. */
export function ProgramCompletionReviewPrompt({
  programId,
  enrollment,
}: ProgramCompletionReviewPromptProps) {
  const isCompleted = enrollment.status === "Completed";
  const { data } = useMyProgramReview(programId, { enabled: isCompleted });
  const [dismissedEnrollmentId, setDismissedEnrollmentId] = useState<string | null>(null);

  // `data` only resolves client-side, so reading localStorage here never runs during SSR.
  const isOpen =
    isCompleted &&
    Boolean(data?.canReview) &&
    dismissedEnrollmentId !== enrollment.id &&
    !isPromptDismissed(enrollment.id);

  const dismiss = () => {
    markPromptDismissed(enrollment.id);
    setDismissedEnrollmentId(enrollment.id);
  };

  if (!isCompleted) return null;

  return (
    <ProgramReviewDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
      programId={programId}
      programName={enrollment.name}
      variant="completion"
      onSaved={dismiss}
    />
  );
}
