"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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

const PATH_LABELS: Record<string, string> = {
  manager: "Tổng quan",
  programs: "Chương trình",
  create: "Tạo mới",
  modules: "Module",
  courses: "Khóa học",
  activities: "Hoạt động",
  materials: "Tài liệu",
  "question-bank": "Ngân hàng câu hỏi",
  milestones: "Milestone nghiên cứu",
  classes: "Lớp học",
  redelivery: "Học lại lớp",
  sessions: "Lịch học",
  attendance: "Điểm danh",
  assignments: "Bài tập",
  enrollments: "Đăng ký học",
  reviews: "Đánh giá",
  experts: "Chuyên gia",
  mentors: "Duyệt Mentor",
};

export function ManagerHeader({
  title: _title,
  onOpenCommand: _onOpenCommand,
}: {
  title?: string;
  onOpenCommand?: () => void;
}) {
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
        } else if (prevSegment === "classes") {
          const { getClassById } = await import("@/lib/api");
          const res = await getClassById(id);
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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 transition-[width,height] ease-linear">
      {/* Left section: Sidebar trigger & Breadcrumbs */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 bg-border"
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
                    {index > 0 && <BreadcrumbSeparator className="text-muted-foreground/60" />}
                    <BreadcrumbItem>
                      {item.isLast ? (
                        <BreadcrumbPage className="font-heading font-semibold text-foreground">
                          {displayLabel}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          render={<Link href={item.url} />}
                          className="font-heading text-muted-foreground hover:text-primary transition-colors"
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

      {/* Right section: notifications + theme */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle className="text-muted-foreground hover:text-foreground hover:bg-muted" />
      </div>
    </header>
  );
}
