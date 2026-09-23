import type { AdvisoryThread } from "@/lib/api/entities/program-advisory";

/** Required changes stay actionable after a new submission is opened. */
export function isOutstandingRequiredChange(
  thread: Pick<AdvisoryThread, "type" | "status">,
): boolean {
  return thread.type === "RequiredChange" && thread.status !== "Resolved";
}

/**
 * Keep notes for the submission on screen, and always keep unresolved
 * required changes from earlier submissions.
 */
export function selectVisibleAdvisoryThreads(
  threads: AdvisoryThread[],
  submissionId?: string | null,
): AdvisoryThread[] {
  return threads.filter(
    (thread) =>
      isOutstandingRequiredChange(thread) ||
      !submissionId ||
      thread.submissionId == null ||
      thread.submissionId === submissionId,
  );
}
