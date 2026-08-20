"use client";

import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  RotateCcw,
  Users,
} from "lucide-react";

import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  {
    title: "Lớp của tôi",
    description: "Vào lớp đang dạy, điểm danh và chấm bài.",
    href: "/mentor/classes",
    icon: Users,
  },
  {
    title: "Lịch dạy",
    description: "Xem lịch tuần trên tất cả lớp được gán.",
    href: "/mentor/schedule",
    icon: CalendarDays,
  },
  {
    title: "Đơn đăng ký lớp",
    description: "Đăng ký nhận lớp mới trên bảng tuyển sinh.",
    href: "/mentor/board",
    icon: ClipboardList,
  },
  {
    title: "Phục hồi bài tập",
    description: "Duyệt yêu cầu làm lại bài của học viên.",
    href: "/mentor/recovery",
    icon: RotateCcw,
  },
] as const;

export function MentorOverview() {
  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Tổng quan"
        description="Lối tắt vào công việc giảng dạy hôm nay."
      />
      <div className="grid gap-4 px-6 pb-12 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <item.icon className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="font-heading text-base font-semibold text-foreground">
                {item.title}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-auto h-8 w-fit px-0 text-sm font-semibold text-primary hover:bg-transparent hover:text-primary/80"
              tabIndex={-1}
            >
              Mở →
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
