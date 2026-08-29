import { parseApiDateTime } from "@/lib/api/datetime";

const STORAGE_PREFIX = "obox:class-hold:";
const CHECKOUT_REDIRECT_PREFIX = "obox:checkout-redirect:";

export type ClassHold = {
  classId: string;
  holdExpiresAt: string;
  programEnrollmentId: string;
};

/** @deprecated Use `ClassHold` */
export type SeatHold = ClassHold;

function storageKey(programId: string): string {
  return `${STORAGE_PREFIX}${programId}`;
}

/** Persist class hold from select-class (survives page refresh / Stripe redirect). */
export function saveClassHold(programId: string, hold: ClassHold): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(programId), JSON.stringify(hold));
  } catch {
    // Ignore quota / private mode.
  }
}

/** @deprecated Use `saveClassHold` */
export const saveSeatHold = saveClassHold;

export function getClassHold(programId: string): ClassHold | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(programId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClassHold;
    if (
      typeof parsed.classId !== "string" ||
      typeof parsed.holdExpiresAt !== "string" ||
      typeof parsed.programEnrollmentId !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** @deprecated Use `getClassHold` */
export const getSeatHold = getClassHold;

export function clearClassHold(programId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(programId));
  } catch {
    // Ignore.
  }
}

/** @deprecated Use `clearClassHold` */
export const clearSeatHold = clearClassHold;

/** Skip release-class-hold while redirecting to Stripe (hold required for checkout). */
export function markCheckoutRedirect(programId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${CHECKOUT_REDIRECT_PREFIX}${programId}`, "1");
  } catch {
    // Ignore.
  }
}

export function isCheckoutRedirectPreserved(programId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem(`${CHECKOUT_REDIRECT_PREFIX}${programId}`) === "1"
    );
  } catch {
    return false;
  }
}

export function clearCheckoutRedirectPreserved(programId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${CHECKOUT_REDIRECT_PREFIX}${programId}`);
  } catch {
    // Ignore.
  }
}

/**
 * Direct student checkout returned from Stripe — read and clear redirect flag.
 * Parent-pay never sets this flag.
 */
export function consumeDirectCheckoutRedirectProgramId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(CHECKOUT_REDIRECT_PREFIX)) continue;
      if (sessionStorage.getItem(key) !== "1") continue;
      const programId = key.slice(CHECKOUT_REDIRECT_PREFIX.length);
      clearCheckoutRedirectPreserved(programId);
      return programId;
    }
  } catch {
    // Ignore.
  }
  return null;
}

export function clearProgramCheckoutHold(programId: string): void {
  clearClassHold(programId);
  clearCheckoutRedirectPreserved(programId);
}

/** Compare hold expiry using API ISO timestamps (UTC `Z` / `+00:00`). */
export function getClassHoldExpiryMs(
  holdExpiresAt: string | null | undefined,
): number | null {
  if (!holdExpiresAt) return null;
  const expires = parseApiDateTime(holdExpiresAt)?.getTime();
  return expires == null || Number.isNaN(expires) ? null : expires;
}

/** Milliseconds until hold expires (0 when missing or already expired). */
export function getHoldRemainingMs(
  holdExpiresAt: string | null | undefined,
  now = Date.now(),
): number {
  const expires = getClassHoldExpiryMs(holdExpiresAt);
  if (expires == null) return 0;
  return Math.max(0, expires - now);
}

export function isHoldValid(
  holdExpiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  return getHoldRemainingMs(holdExpiresAt, now) > 0;
}

export function isClassHoldActive(
  hold: ClassHold | null,
  now = Date.now(),
): boolean {
  if (!hold) return false;
  return isHoldValid(hold.holdExpiresAt, now);
}

/** @deprecated Use `isClassHoldActive` */
export const isSeatHoldActive = isClassHoldActive;
