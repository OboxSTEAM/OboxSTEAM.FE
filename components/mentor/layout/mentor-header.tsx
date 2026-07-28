"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E5E0] bg-white px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#2D2D2D]" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 bg-[#E5E5E0]"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <span key={item.url} className="contents">
                {index > 0 ? (
                  <BreadcrumbSeparator className="text-[#6B6B6B]/60" />
                ) : null}
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage className="font-heading font-semibold text-[#2D2D2D]">
                      {title ?? item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link href={item.url} />}
                      className="font-heading text-[#6B6B6B] transition-colors hover:text-[#E94B3C]"
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
    </header>
  );
}
