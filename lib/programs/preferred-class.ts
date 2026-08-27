const STORAGE_PREFIX = "obox:preferred-class:";

function storageKey(programId: string): string {
  return `${STORAGE_PREFIX}${programId}`;
}

/** Soft preference only — no seat hold. Survives checkout redirect. */
export function getPreferredClassId(programId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(storageKey(programId));
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function setPreferredClassId(programId: string, classId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(programId), classId);
  } catch {
    // Ignore quota / private mode.
  }
}

export function clearPreferredClassId(programId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(programId));
  } catch {
    // Ignore.
  }
}
