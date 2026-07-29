"use client";

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
  board: "Bảng lớp",
  requests: "Yêu cầu của tôi",
};

export function MentorHeader({ title }: { title?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbItems = segments.map((segment, index) => {
    const url = `/${segments.slice(0, index + 1).join("/")}`;
    const label = PATH_LABELS[segment] ?? segment;
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
                      {title ?? item.label}
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
