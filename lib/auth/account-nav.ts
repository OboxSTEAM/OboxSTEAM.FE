import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, LogOut, Settings, User } from "lucide-react";

export type AccountNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

/** Mock destinations until learner dashboard routes exist. */
export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
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

export const LOGOUT_NAV_ITEM = {
  label: "Đăng xuất",
  icon: LogOut,
} as const;
