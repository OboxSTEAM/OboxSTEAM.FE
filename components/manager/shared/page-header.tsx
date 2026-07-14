import Link from "next/link";
import type { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type BreadcrumbItemType = {
  label: string;
  href?: string;
};

type ManagerPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemType[];
  children?: ReactNode; // For action buttons or toolbar items
};

export function ManagerPageHeader({
  title,
  description,
  breadcrumbs,
  children,
}: ManagerPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E5E5E0] bg-white px-6 py-5">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/manager" />}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={item.href} />}>
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      {/* Main Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#2D2D2D]">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-[#6B6B6B]">{description}</p>
          ) : null}
        </div>
        {children ? (
          <div className="flex shrink-0 items-center gap-3">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
