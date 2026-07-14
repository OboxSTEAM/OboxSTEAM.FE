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

function storageKey(submissionId: string): string {
  return `${STORAGE_PREFIX}${submissionId}`;
}

export function getStoredResearchStaging(
  submissionId: string,
): ResearchStagingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(submissionId));
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
  submissionId: string,
  state: ResearchStagingState,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(submissionId), JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearStoredResearchStaging(submissionId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(submissionId));
  } catch {
    // Ignore.
  }
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
