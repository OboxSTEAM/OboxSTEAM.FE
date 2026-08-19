import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DashboardPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card p-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function DashboardGroupHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-0.5 pt-1">
      <h2 className="font-heading text-sm font-bold tracking-tight text-foreground sm:text-base">
        {title}
      </h2>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function DashboardSectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-heading text-[13px] font-bold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
