import type { UserProfile } from "@/lib/api/entities/user";

const PARENT_PROFILE_PENDING_KEY = "oboxsteam.parentProfilePending";

export function isParentProfileIncomplete(profile: UserProfile): boolean {
  return profile.role === "Parent" && profile.isEmailVerified === false;
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

export function shouldShowParentProfileGate(profile: UserProfile | null): boolean {
  if (!profile || profile.role !== "Parent") return false;
  return getParentProfilePending() || isParentProfileIncomplete(profile);
}
