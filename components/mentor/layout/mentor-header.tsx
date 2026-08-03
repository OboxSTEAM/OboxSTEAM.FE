"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  mentor: "Mentor",
  classes: "Lớp của tôi",
  board: "Đăng ký lớp",
  requests: "Đăng ký lớp",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function MentorHeader({ title: _title }: { title?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [resolvedLabels, setResolvedLabels] = React.useState<
    Record<string, string>
  >({});

  React.useEffect(() => {
    const uuidSegments = segments.filter(
      (seg) => UUID_RE.test(seg) && !resolvedLabels[seg],
    );
    if (uuidSegments.length === 0) return;

    uuidSegments.forEach(async (id) => {
      try {
        const idx = segments.indexOf(id);
        const prevSegment = idx > 0 ? segments[idx - 1] : "";
        if (prevSegment === "classes") {
          const { getClassById } = await import("@/lib/api");
          const res = await getClassById(id);
          if (res?.data?.name) {
            setResolvedLabels((prev) => ({ ...prev, [id]: res.data.name }));
          }
        }
      } catch {
        // Keep raw id in breadcrumb on failure.
      }
    });
  }, [segments, resolvedLabels]);

  const breadcrumbItems = segments.map((segment, index) => {
    const url = `/${segments.slice(0, index + 1).join("/")}`;
    const label = PATH_LABELS[segment] ?? resolvedLabels[segment] ?? segment;
    const isLast = index === segments.length - 1;
    return { label, url, isLast };
  });

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-muted hover:text-foreground" />
        <Separator
          orientation="vertical"
          className="mr-2 bg-border data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <span key={item.url} className="contents">
                {index > 0 ? (
                  <BreadcrumbSeparator className="text-muted-foreground/60" />
                ) : null}
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage className="font-heading font-semibold text-foreground">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link href={item.url} />}
                      className="font-heading text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle className="text-muted-foreground hover:bg-muted hover:text-foreground" />
      </div>
    </header>
  );
}
