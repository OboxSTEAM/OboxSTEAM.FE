"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Clock,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function ManagerOverviewPage() {
  const { profile } = useCurrentUser();

  // Mock stats
  const stats = [
    {
      label: "Chương trình hoạt động",
      value: "12",
      change: "+2 tháng này",
      color: "#E94B3C", // Obox Red - Science
      icon: BookOpen,
      bgTint: "bg-[#E94B3C]/5",
      borderTint: "border-[#E94B3C]/10",
    },
    {
      label: "Lớp học hoạt động",
      value: "28",
      change: "+4 tuần này",
      color: "#4FC3F7", // Obox Cyan - Engineering
      icon: GraduationCap,
      bgTint: "bg-[#4FC3F7]/5",
      borderTint: "border-[#4FC3F7]/10",
    },
    {
      label: "Học viên đăng ký",
      value: "1,420",
      change: "+12.5% so với tháng trước",
      color: "#7CB342", // Obox Green - Technology
      icon: Users,
      bgTint: "bg-[#7CB342]/5",
      borderTint: "border-[#7CB342]/10",
    },
    {
      label: "Mentor chờ duyệt",
      value: "7",
      change: "Cần xử lý ngay",
      color: "#7E57C2", // Obox Purple - Mathematics
      icon: UserCheck,
      bgTint: "bg-[#7E57C2]/5",
      borderTint: "border-[#7E57C2]/10",
      isAlert: true,
    },
  ];

  // Mock recent activities
  const activities = [
    {
      id: 1,
      user: "Nguyễn Minh Anh",
      action: "đăng ký học thử chương trình",
      target: "Robotics & AI Cơ bản",
      time: "10 phút trước",
      type: "enrollment",
      status: "Mới",
      statusColor: "bg-[#4FC3F7]/10 text-[#0d6e9c]",
    },
    {
      id: 2,
      user: "Trần Quốc Bảo (Mentor)",
      action: "đã cập nhật hồ sơ chuyên môn",
      target: "CV & Bằng cấp sư phạm",
      time: "1 giờ trước",
      type: "mentor",
      status: "Chờ duyệt",
      statusColor: "bg-[#7E57C2]/10 text-[#51308a]",
    },
    {
      id: 3,
      user: "Lê Thị Thu Thủy",
      action: "đã đánh giá 5 sao cho khóa học",
      target: "Khoa học vũ trụ 101",
      time: "3 giờ trước",
      type: "review",
      status: "Công khai",
      statusColor: "bg-[#7CB342]/10 text-[#3d5c22]",
    },
    {
      id: 4,
      user: "Hệ thống AI",
      action: "tự động gắn tag ảnh lớp học",
      target: "Lớp Robot Lab B1 - Buổi 3",
      time: "5 giờ trước",
      type: "system",
      status: "Hoàn tất",
      statusColor: "bg-[#E5E5E0] text-[#2D2D2D]",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8 bg-[#FAFAF5]">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white p-6 shadow-sm">
        {/* Subtle decorative background gradient */}
        <div className="absolute right-0 top-0 -z-10 h-full w-1/3 bg-gradient-to-l from-[#4FC3F7]/10 via-[#7E57C2]/5 to-transparent opacity-70" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E94B3C]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#E94B3C]">
            OboxSTEAM Dashboard
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-[#2D2D2D] sm:text-3xl">
            Chào mừng trở lại, {profile?.fullName ?? "Manager"}!
          </h2>
          <p className="max-w-2xl text-sm text-[#6B6B6B] leading-relaxed">
            Hôm nay hệ thống ghi nhận sự tăng trưởng ổn định. Bạn có <span className="font-semibold text-[#E94B3C]">7 hồ sơ Mentor</span> đang chờ duyệt và <span className="font-semibold text-[#4FC3F7]">4 lớp học mới</span> bắt đầu trong tuần này.
          </p>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
            >
              {/* Top border colored accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: card.color }}
              />

              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`flex size-9 items-center justify-center rounded-xl ${card.bgTint} ${card.borderTint} border`}>
                  <Icon className="size-5" style={{ color: card.color }} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className="font-heading text-3xl font-black tracking-tight tabular-nums"
                  style={{ color: card.color }}
                >
                  {card.value}
                </span>
                <span
                  className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    card.isAlert ? "bg-[#E94B3C]/10 text-[#E94B3C]" : "bg-[#F5F5F0] text-[#6B6B6B]"
                  }`}
                >
                  {card.change}
                </span>
              </div>

              {/* Action indicator on hover */}
              <div className="absolute right-4 bottom-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ArrowUpRight className="size-4 text-[#6B6B6B]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Telemetry Chart & Recent Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Telemetry Chart Card - spans 2 columns */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-[#E5E5E0] bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold text-[#2D2D2D]">
                  Xu hướng Đăng ký học
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Thống kê số lượng đăng ký mới trong 30 ngày qua
                </p>
              </div>
              <div className="flex items-center gap-1 bg-[#F5F5F0] px-2.5 py-1 rounded-lg text-xs font-semibold text-[#2D2D2D]">
                <TrendingUp className="size-3.5 text-[#7CB342]" />
                <span>+14.8%</span>
              </div>
            </div>

            {/* Custom SVG premium graph */}
            <div className="relative mt-6 h-60 w-full rounded-xl bg-gradient-to-b from-[#FAFAF5] to-white p-2">
              {/* Grid Background Lines */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 py-8 pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full border-b border-[#E5E5E0]/40" />
                ))}
              </div>

              {/* Gorgeous SVG Line Chart */}
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#E94B3C" />
                    <stop offset="50%" stopColor="#7E57C2" />
                    <stop offset="100%" stopColor="#4FC3F7" />
                  </linearGradient>
                </defs>

                {/* Area Fill under the curve */}
                <path
                  d="M 0 160 Q 60 120 120 135 T 240 80 T 360 90 T 480 40 T 600 30 L 600 200 L 0 200 Z"
                  fill="url(#chartGradient)"
                />

                {/* Main line */}
                <path
                  d="M 0 160 Q 60 120 120 135 T 240 80 T 360 90 T 480 40 T 600 30"
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Interactive Points */}
                <circle cx="120" cy="135" r="5" fill="#7E57C2" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="240" cy="80" r="5" fill="#7E57C2" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="480" cy="40" r="5" fill="#4FC3F7" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="600" cy="30" r="5" fill="#4FC3F7" stroke="#FFFFFF" strokeWidth="2" />
              </svg>

              {/* Data points overlays */}
              <div className="absolute top-[40px] left-[77%] -translate-x-1/2 bg-[#2D2D2D] text-white px-2 py-0.5 rounded text-[10px] font-mono shadow-md pointer-events-none">
                128 học viên
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#E5E5E0]/60 pt-4 text-xs text-[#6B6B6B]">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#E94B3C]" /> Science
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#7E57C2]" /> Math
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#4FC3F7]" /> Engineering
              </span>
            </div>
            <span>Dữ liệu thực tế được tự động đồng bộ hóa</span>
          </div>
        </div>

        {/* Action Required / Recent activity card */}
        <div className="rounded-2xl border border-[#E5E5E0] bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-[#2D2D2D]">
                Hoạt động Gần đây
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Các sự kiện cần chú ý trên hệ thống
              </p>
            </div>

            {/* List */}
            <div className="space-y-3.5">
              {activities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FAFAF5] border border-[#E5E5E0]/60">
                    <Activity className="size-3.5 text-[#6B6B6B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#2D2D2D] font-medium truncate">
                      {act.user}
                    </p>
                    <p className="text-[#6B6B6B] text-[11px]">
                      {act.action} <span className="text-[#2D2D2D] font-medium">{act.target}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#6B6B6B]/80 flex items-center gap-1 font-light">
                        <Clock className="size-2.5" />
                        {act.time}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${act.statusColor}`}>
                        {act.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/manager/enrollments"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full text-xs font-semibold text-[#E94B3C] hover:text-[#E94B3C] hover:bg-[#E94B3C]/5 mt-4 group flex items-center justify-center gap-1.5"
            )}
          >
            Xem tất cả hoạt động
            <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
