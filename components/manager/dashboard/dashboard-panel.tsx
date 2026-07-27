import { cn } from "@/lib/utils";

export function DashboardPanel({
  children,
  className,
}: {
  children: React.ReactNode;
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

export function DashboardSectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-heading text-[13px] font-bold text-foreground">
          {title}
        </h2>
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
