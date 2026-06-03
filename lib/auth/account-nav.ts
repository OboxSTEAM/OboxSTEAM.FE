import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, LogOut, Settings, User, Users } from "lucide-react";

export type AccountNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

/** Mock destinations until learner dashboard routes exist. */
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

/** @deprecated Use getAccountNavItems(role) */
export const ACCOUNT_NAV_ITEMS = STUDENT_ACCOUNT_NAV_ITEMS;

export function getAccountNavItems(role?: string): AccountNavItem[] {
  if (role === "Parent") return PARENT_ACCOUNT_NAV_ITEMS;
  return STUDENT_ACCOUNT_NAV_ITEMS;
}

export function getDefaultDisplayName(role?: string): string {
  if (role === "Parent") return "Phụ huynh";
  return "Học viên";
}

export const LOGOUT_NAV_ITEM = {
  label: "Đăng xuất",
  icon: LogOut,
} as const;
