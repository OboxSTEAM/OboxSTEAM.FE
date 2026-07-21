import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, LogOut, Settings, Shield, User, Users } from "lucide-react";

import { isManagerRole, isParentRole, normalizeAccountRole } from "@/lib/auth/roles";

export type AccountNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

/** Student account destinations (learner dashboard). */
export const STUDENT_ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  {
    label: "Hồ sơ cá nhân",
    href: "/profile",
    icon: User,
    description: "Thông tin học viên & portfolio",
  },
  {
    label: "Khóa học của tôi",
    href: "/courses",
    icon: BookOpen,
    description: "Tiến độ & lịch học",
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: LayoutDashboard,
    description: "Microsite học tập",
  },
  {
    label: "Cài đặt tài khoản",
    href: "/settings",
    icon: Settings,
  },
];

export const PARENT_ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  {
    label: "Hồ sơ cá nhân",
    href: "/profile",
    icon: User,
    description: "Thông tin phụ huynh",
  },
  {
    label: "Thông tin con",
    href: "/parent/children",
    icon: Users,
    description: "Theo dõi học viên đã liên kết",
  },
];

export const MANAGER_ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  {
    label: "Dashboard",
    href: "/manager",
    icon: Shield,
    description: "Tổng quan quản lý",
  },
  {
    label: "Hồ sơ cá nhân",
    href: "/profile",
    icon: User,
    description: "Thông tin tài khoản",
  },
];

/** @deprecated Use getAccountNavItems(role) */
export const ACCOUNT_NAV_ITEMS = STUDENT_ACCOUNT_NAV_ITEMS;

export function getAccountNavItems(role?: string | null): AccountNavItem[] {
  if (isParentRole(role)) return PARENT_ACCOUNT_NAV_ITEMS;
  if (isManagerRole(role)) return MANAGER_ACCOUNT_NAV_ITEMS;
  return STUDENT_ACCOUNT_NAV_ITEMS;
}

/** Short role label for header / account menu when name is unavailable. */
export function getAccountRoleLabel(role?: string | null): string {
  if (isParentRole(role)) return "Phụ huynh";
  if (isManagerRole(role)) return "Quản lý";
  if (normalizeAccountRole(role) === "Mentor") return "Mentor";
  return "Học viên";
}

/** @deprecated Prefer getAccountRoleLabel — kept for callers using “display name”. */
export function getDefaultDisplayName(role?: string | null): string {
  return getAccountRoleLabel(role);
}

export const LOGOUT_NAV_ITEM = {
  label: "Đăng xuất",
  icon: LogOut,
} as const;
