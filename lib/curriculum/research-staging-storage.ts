export type ResearchStagingEvidence = {
  /** Class-media asset id — required for submit as EvidenceMediaAssetIds. */
  mediaAssetId: string;
  /** Preview URL from upload / GET (display only). */
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

function normalizeEvidence(raw: unknown): ResearchStagingEvidence[] {
  if (!Array.isArray(raw)) return [];
  const items: ResearchStagingEvidence[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const mediaAssetId =
      typeof record.mediaAssetId === "string" ? record.mediaAssetId.trim() : "";
    const url = typeof record.url === "string" ? record.url.trim() : "";
    const name =
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : url
          ? fileNameFromUrl(url)
          : "minh chứng";
    // Drop legacy URL-only staging rows — they cannot be submitted under the new contract.
    if (!mediaAssetId || !url) continue;
    items.push({ mediaAssetId, url, name });
  }
  return items;
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
      evidence: normalizeEvidence(parsed.evidence),
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
