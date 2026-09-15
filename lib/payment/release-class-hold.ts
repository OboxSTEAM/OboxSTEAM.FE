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

export type ReleaseClassHoldOnExitOptions = {
  keepalive?: boolean;
  /**
   * When localStorage hold was cleared (e.g. expired) but BE still has
   * PendingPayment — still call release-class-hold (idempotent).
   */
  forceRelease?: boolean;
};

function hasReleasableHold(
  programId: string,
  forceRelease = false,
): boolean {
  if (isCheckoutRedirectPreserved(programId)) return false;
  if (forceRelease) return true;
  const stored = getClassHold(programId);
  return Boolean(stored?.programEnrollmentId?.trim());
}

function clearLocalHoldState(programId: string): void {
  clearClassHold(programId);
  clearPreferredClassId(programId);
  clearCheckoutRedirectPreserved(programId);
}

/**
 * Direct Stripe cancel/fail — BE already releases seat + PendingPayment.
 * FE only clears stale localStorage so program detail does not show an old hold.
 * Do not call `releaseProgramClassHold` here.
 */
export function clearLocalHoldAfterDirectCheckoutCancel(
  programId: string,
): void {
  clearLocalHoldState(programId);
}

/** Best-effort release during tab close / reload (`fetch` keepalive). */
export function releaseProgramClassHoldKeepalive(
  programId: string,
  forceRelease = false,
): void {
  if (typeof window === "undefined") return;
  if (!hasReleasableHold(programId, forceRelease)) return;

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
  options?: ReleaseClassHoldOnExitOptions,
): Promise<void> {
  const forceRelease = Boolean(options?.forceRelease);

  // Skip while redirecting to Stripe — hold must survive until checkout completes or BE cancel webhook.
  if (!hasReleasableHold(programId, forceRelease)) return;

  if (options?.keepalive) {
    releaseProgramClassHoldKeepalive(programId, forceRelease);
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
