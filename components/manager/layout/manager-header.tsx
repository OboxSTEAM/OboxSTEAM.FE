"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const PATH_LABELS: Record<string, string> = {
  manager: "Tổng quan",
  programs: "Chương trình",
  create: "Tạo mới",
  modules: "Module",
  courses: "Khóa học",
  activities: "Hoạt động",
  materials: "Tài liệu",
  "question-bank": "Ngân hàng câu hỏi",
  milestones: "Milestone",
  classes: "Lớp học",
  sessions: "Lịch học",
  attendance: "Điểm danh",
  assignments: "Bài tập",
  enrollments: "Đăng ký học",
  reviews: "Đánh giá",
  experts: "Chuyên gia",
  mentors: "Duyệt Mentor",
};

export function ManagerHeader({ title: _title }: { title?: string }) {
  const pathname = usePathname();
  const [resolvedLabels, setResolvedLabels] = React.useState<Record<string, string>>({});

  const segments = pathname.split("/").filter(Boolean);

  React.useEffect(() => {
    const uuidSegments = segments.filter(
      (seg) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) &&
        !resolvedLabels[seg]
    );

    if (uuidSegments.length === 0) return;

    uuidSegments.forEach(async (id) => {
      try {
        const idx = segments.indexOf(id);
        const prevSegment = idx > 0 ? segments[idx - 1] : "";

        if (prevSegment === "programs") {
          const { getProgramById } = await import("@/lib/api");
          const res = await getProgramById(id);
          if (res?.data?.name) {
            setResolvedLabels((prev) => ({ ...prev, [id]: res.data.name }));
          }
        }
      } catch (err) {
        console.error("Failed to load breadcrumb label for id:", id, err);
      }
    });
  }, [segments, resolvedLabels]);

  // Generate dynamic breadcrumb segments based on pathname
  const breadcrumbItems = segments.map((segment, index) => {
    const url = "/" + segments.slice(0, index + 1).join("/");
    const label = PATH_LABELS[segment] || resolvedLabels[segment] || segment;
    const isLast = index === segments.length - 1;
    return { label, url, isLast };
  });

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E5E0] bg-white px-4 transition-[width,height] ease-linear">
      {/* Left section: Sidebar trigger & Breadcrumbs */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#F5F5F0]" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 bg-[#E5E5E0]"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.length > 1 &&
              breadcrumbItems.map((item, index) => {
                // If it is 'manager', it points to dashboard overview
                const isManagerSegment = index === 0 && segments[0] === "manager";
                const displayLabel = isManagerSegment ? "Tổng quan" : item.label;

                return (
                  <React.Fragment key={item.url}>
                    {index > 0 && <BreadcrumbSeparator className="text-[#6B6B6B]/60" />}
                    <BreadcrumbItem>
                      {item.isLast ? (
                        <BreadcrumbPage className="font-heading font-semibold text-[#2D2D2D]">
                          {displayLabel}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          render={<Link href={item.url} />}
                          className="font-heading text-[#6B6B6B] hover:text-[#E94B3C] transition-colors"
                        >
                          {displayLabel}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right section: Notification action button */}
      <div className="flex items-center gap-4">
        {/* Simple Notification Button for Premium aesthetic */}
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-full text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#F5F5F0]"
          aria-label="Thông báo"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#E94B3C]" />
        </Button>
      </div>
    </header>
  );
}
