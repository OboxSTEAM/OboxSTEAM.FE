import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserRound,
} from "lucide-react";

export type ExpertNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type ExpertNavGroup = {
  title: string;
  items: ExpertNavItem[];
};

/** Workflow-oriented expert IA — flat links under group labels (no parent==child). */
export const EXPERT_NAV_GROUPS: ExpertNavGroup[] = [
  {
    title: "Công việc",
    items: [
      {
        label: "Chương trình phụ trách",
        href: "/expert/programs",
        icon: GraduationCap,
      },
      {
        label: "Khung chương trình",
        href: "/expert/frameworks",
        icon: BookOpen,
      },
      {
        label: "Lịch đồng hành",
        href: "/expert/schedule",
        icon: CalendarDays,
      },
      {
        label: "Hồ sơ chuyên môn",
        href: "/expert/profile",
        icon: UserRound,
      },
    ],
  },
];

export function isExpertNavItemActive(href: string, pathname: string): boolean {
  if (href === "/expert") return pathname === "/expert";
  return pathname === href || pathname.startsWith(`${href}/`);
}
