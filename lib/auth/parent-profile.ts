import type { UserProfile } from "@/lib/api/entities/user";
import { isParentRole } from "@/lib/auth/roles";

const PARENT_PROFILE_PENDING_KEY = "oboxsteam.parentProfilePending";

export function isParentProfileIncomplete(profile: UserProfile): boolean {
  return isParentRole(profile.role) && profile.isEmailVerified === false;
}

export function setParentProfilePending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PARENT_PROFILE_PENDING_KEY, "1");
}

export function getParentProfilePending(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PARENT_PROFILE_PENDING_KEY) === "1";
}

export function clearParentProfilePending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PARENT_PROFILE_PENDING_KEY);
}

/**
 * Show blocking complete-profile UI for shadow parents.
 * `parentProfilePending` is set right after magic-login so the gate can open
 * even while `/api/account/me` is still loading.
 */
export function shouldShowParentProfileGate(
  profile: UserProfile | null,
  options?: { isAuthenticated?: boolean },
): boolean {
  if (options?.isAuthenticated && getParentProfilePending()) return true;
  if (!profile || !isParentRole(profile.role)) return false;
  return getParentProfilePending() || isParentProfileIncomplete(profile);
}
