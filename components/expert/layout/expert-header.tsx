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
  expert: "Chuyên gia",
  reviews: "Duyệt chương trình",
  frameworks: "Bộ khung thẩm định",
  schedule: "Lịch đồng hành chuyên môn",
  profile: "Hồ sơ chuyên môn",
};

export function ExpertHeader({ title }: { title?: string }) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbItems = segments.map((segment, index) => {
    const url = "/" + segments.slice(0, index + 1).join("/");
    const label = PATH_LABELS[segment] || segment;
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
            {breadcrumbItems.length > 1 ? (
              breadcrumbItems.map((item, index) => (
                <React.Fragment key={item.url}>
                  {index > 0 && (
                    <BreadcrumbSeparator className="text-muted-foreground/60" />
                  )}
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage className="font-heading font-semibold text-foreground">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<Link href={item.url} />}
                        className="font-heading text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))
            ) : title ? (
              <BreadcrumbItem>
                <BreadcrumbPage className="font-heading font-semibold text-foreground">
                  {title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : null}
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
