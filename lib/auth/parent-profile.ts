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

/** Drop magic-login handoff flag when the signed-in user is not a parent. */
export function syncParentProfilePendingForProfile(profile: UserProfile | null): void {
  if (profile && !isParentRole(profile.role)) {
    clearParentProfilePending();
  }
}

/**
 * Show blocking complete-profile UI for shadow parents only.
 * `parentProfilePending` is set after magic-login; must not apply to students.
 */
export function shouldShowParentProfileGate(profile: UserProfile | null): boolean {
  if (!profile || !isParentRole(profile.role)) return false;
  return getParentProfilePending() || isParentProfileIncomplete(profile);
}

/** Gate may open while `/me` loads after magic-login, before role is known. */
export function shouldShowParentProfileGateWhileLoading(
  profile: UserProfile | null,
  isLoading: boolean,
): boolean {
  if (!getParentProfilePending()) return false;
  if (profile && !isParentRole(profile.role)) return false;
  return isLoading || !profile;
}
