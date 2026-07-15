import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileQuestion,
  FolderTree,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  Star,
  Target,
  Upload,
  UserCheck,
  Users,
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

export const MANAGER_NAV_GROUPS: ManagerNavGroup[] = [
  {
    title: "Tổng quan",
    items: [
      {
        label: "Dashboard",
        href: "/manager",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Chương trình & Nội dung",
    items: [
      {
        label: "Chương trình",
        href: "/manager/programs",
        icon: LayoutGrid,
      },
      {
        label: "Module",
        href: "/manager/programs",
        icon: FolderTree,
      },
      {
        label: "Khóa học",
        href: "/manager/programs",
        icon: BookOpen,
      },
      {
        label: "Hoạt động",
        href: "/manager/activities",
        icon: Layers,
      },
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
  {
    title: "Lớp học",
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
    ],
  },
  {
    title: "Vận hành",
    items: [
      {
        label: "Đăng ký học",
        href: "/manager/enrollments",
        icon: ClipboardList,
      },
      {
        label: "Đánh giá",
        href: "/manager/reviews",
        icon: Star,
      },
      {
        label: "Chuyên gia",
        href: "/manager/experts",
        icon: Users,
      },
      {
        label: "Duyệt Mentor",
        href: "/manager/mentors",
        icon: UserCheck,
      },
    ],
  },
];
