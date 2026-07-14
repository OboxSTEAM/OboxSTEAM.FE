import type { ReactNode } from "react";

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
  children,
}: ManagerPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E5E5E0] bg-white px-6 py-5">
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
