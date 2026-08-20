import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  RefreshCw,
  Target,
  Upload,
  Users,
  UserCheck,
} from "lucide-react";

export type ManagerNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type ManagerNavGroup = {
  title: string;
  items: ManagerNavItem[];
};

/** Workflow-oriented manager IA — flat links under group labels (no parent==child). */
export const MANAGER_NAV_GROUPS: ManagerNavGroup[] = [
  {
    title: "Hôm nay",
    items: [
      {
        label: "Tổng quan",
        href: "/manager",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Nội dung",
    items: [
      {
        label: "Chương trình",
        href: "/manager/programs",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Vận hành",
    items: [
      {
        label: "Lớp học",
        href: "/manager/classes",
        icon: Users,
      },
      {
        label: "Lịch học",
        href: "/manager/sessions",
        icon: CalendarDays,
      },
      {
        label: "Điểm danh",
        href: "/manager/attendance",
        icon: CheckSquare,
      },
      {
        label: "Học lại lớp",
        href: "/manager/redelivery",
        icon: RefreshCw,
      },
      {
        label: "Chuyên gia",
        href: "/manager/experts",
        icon: UserCheck,
      },
    ],
  },
  {
    title: "Thư viện",
    items: [
      {
        label: "Tài liệu",
        href: "/manager/materials",
        icon: Upload,
      },
      {
        label: "Ngân hàng câu hỏi",
        href: "/manager/question-bank",
        icon: FileQuestion,
      },
      {
        label: "Milestone nghiên cứu",
        href: "/manager/milestones",
        icon: Target,
      },
      {
        label: "Bài tập",
        href: "/manager/assignments",
        icon: ClipboardList,
      },
    ],
  },
];

export function isManagerNavItemActive(
  href: string,
  pathname: string,
): boolean {
  if (href === "/manager") return pathname === "/manager";
  return pathname === href || pathname.startsWith(`${href}/`);
}
