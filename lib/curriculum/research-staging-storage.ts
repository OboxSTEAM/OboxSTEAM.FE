export type ResearchStagingEvidence = {
  url: string;
  name: string;
};

export type ResearchStagingState = {
  contentText: string;
  fileUrl: string | null;
  fileName: string | null;
  evidence: ResearchStagingEvidence[];
};

const STORAGE_PREFIX = "obox-research-staging:";

/** Stable draft key before upload returns a submissionId. */
export function researchDraftStorageKey(
  moduleEnrollmentId: string,
  researchMilestoneId: string,
): string {
  return `draft:${moduleEnrollmentId}:${researchMilestoneId}`;
}

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function getStoredResearchStaging(
  key: string,
): ResearchStagingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResearchStagingState;
    if (
      typeof parsed !== "object" ||
      parsed == null ||
      typeof parsed.contentText !== "string"
    ) {
      return null;
    }
    return {
      contentText: parsed.contentText,
      fileUrl: parsed.fileUrl ?? null,
      fileName: parsed.fileName ?? null,
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    };
  } catch {
    return null;
  }
}

export function setStoredResearchStaging(
  key: string,
  state: ResearchStagingState,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearStoredResearchStaging(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(key));
  } catch {
    // Ignore.
  }
}

/** Move draft staging under submissionId after lazy-create upload. */
export function migrateResearchStagingKey(
  fromKey: string,
  toKey: string,
): void {
  if (fromKey === toKey) return;
  const stored = getStoredResearchStaging(fromKey);
  if (stored) {
    setStoredResearchStaging(toKey, stored);
  }
  clearStoredResearchStaging(fromKey);
}

export function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const raw = decodeURIComponent(path.split("/").pop() || "");
    return raw || "tệp";
  } catch {
    const raw = url.split("/").pop() || "";
    return decodeURIComponent(raw) || "tệp";
  }
}
