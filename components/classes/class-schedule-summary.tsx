import { cn } from "@/lib/utils";

export type ClassScheduleSummaryProps = {
  summary: string | null | undefined;
  className?: string;
};

/**
 * Split free-text schedule like `T2-T5, 18:00` into days + clock,
 * matching ClassDateRange hierarchy (primary line + mono time).
 */
export function ClassScheduleSummary({
  summary,
  className,
}: ClassScheduleSummaryProps) {
  const trimmed = summary?.trim();
  if (!trimmed) return null;

  const parts = trimmed
    .split(/[,·|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const last = parts[parts.length - 1] ?? "";
    const looksLikeTime = /\d/.test(last) && /:/.test(last);
    if (looksLikeTime) {
      const days = parts.slice(0, -1).join(", ");
      return (
        <div className={cn("min-w-0 space-y-0.5", className)}>
          <p className="font-medium text-foreground">{days}</p>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {last}
          </p>
        </div>
      );
    }
  }

  return (
    <p className={cn("min-w-0 text-sm text-foreground", className)}>{trimmed}</p>
  );
}
