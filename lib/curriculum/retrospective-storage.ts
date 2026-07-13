const STORAGE_PREFIX = "obox-retrospective-submission:";

export function getStoredRetrospectiveSubmissionId(assignmentId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${assignmentId}`);
  } catch {
    return null;
  }
}

export function setStoredRetrospectiveSubmissionId(
  assignmentId: string,
  submissionId: string,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${assignmentId}`, submissionId);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearStoredRetrospectiveSubmissionId(assignmentId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${assignmentId}`);
  } catch {
    // Ignore.
  }
}
