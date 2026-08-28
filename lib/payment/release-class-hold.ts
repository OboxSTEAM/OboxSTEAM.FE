import { getApiBaseUrl } from "@/lib/api/config";
import { releaseProgramClassHold } from "@/lib/api/programs";
import { getAuthSession } from "@/lib/auth/session";
import {
  clearCheckoutRedirectPreserved,
  clearClassHold,
  getClassHold,
  isCheckoutRedirectPreserved,
} from "@/lib/payment/seat-hold";
import { clearPreferredClassId } from "@/lib/programs/preferred-class";

function hasReleasableHold(programId: string): boolean {
  if (isCheckoutRedirectPreserved(programId)) return false;
  const stored = getClassHold(programId);
  return Boolean(stored?.programEnrollmentId?.trim());
}

function clearLocalHoldState(programId: string): void {
  clearClassHold(programId);
  clearPreferredClassId(programId);
  clearCheckoutRedirectPreserved(programId);
}

/** Best-effort release during tab close / reload (`fetch` keepalive). */
export function releaseProgramClassHoldKeepalive(programId: string): void {
  if (typeof window === "undefined" || !hasReleasableHold(programId)) return;

  const token = getAuthSession()?.accessToken;
  if (!token) return;

  const url = `${getApiBaseUrl()}/api/programs/${programId}/release-class-hold`;
  void fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    keepalive: true,
  }).catch(() => {
    /* best-effort */
  });

  clearLocalHoldState(programId);
}

/** Release server hold when leaving program checkout (route change / unmount). */
export async function releaseProgramClassHoldOnExit(
  programId: string,
  options?: { keepalive?: boolean },
): Promise<void> {
  if (!hasReleasableHold(programId)) return;

  if (options?.keepalive) {
    releaseProgramClassHoldKeepalive(programId);
    return;
  }

  try {
    await releaseProgramClassHold(programId);
  } catch {
    /* Idempotent — ignore teardown failures. */
  } finally {
    clearLocalHoldState(programId);
  }
}
