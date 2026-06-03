import type { UserProfile } from "@/lib/api/entities/user";

import { getAccountRoleLabel } from "@/lib/auth/account-nav";
import { isParentRole, normalizeAccountRole } from "@/lib/auth/roles";

export const PROFILE_NAME_PLACEHOLDER = "Chưa cập nhật họ tên";
export const PROFILE_PHONE_PLACEHOLDER = "Chưa cập nhật số điện thoại";

export function getProfileDisplayName(profile: Pick<UserProfile, "fullName" | "email" | "role">): string {
  const name = profile.fullName?.trim();
  if (name) return name;
  const local = profile.email.split("@")[0]?.trim();
  if (local) return local;
  return getAccountRoleLabel(normalizeAccountRole(profile.role));
}

export function getProfileDisplayPhone(phone: string | null | undefined): string {
  const value = phone?.trim();
  return value || PROFILE_PHONE_PLACEHOLDER;
}

export function hasProfileName(profile: Pick<UserProfile, "fullName">): boolean {
  return Boolean(profile.fullName?.trim());
}

export function getProfileInitials(profile: Pick<UserProfile, "fullName" | "email" | "role">): string {
  const name = profile.fullName?.trim() || profile.email.split("@")[0] || "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function isShadowParentProfile(profile: UserProfile): boolean {
  return isParentRole(profile.role) && profile.isEmailVerified === false;
}
