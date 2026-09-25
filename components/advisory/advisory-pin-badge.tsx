import { Check } from "lucide-react";

import type { AdvisoryPinCounts } from "@/lib/advisory/manager-target";
import { cn } from "@/lib/utils";

export function AdvisoryPinBadge({
  counts,
}: {
  counts: AdvisoryPinCounts | undefined;
}) {
  if (!counts) return null;
  const total = counts.openRequired + counts.suggestions;
  if (total === 0) {
    if (!counts.accepted) return null;
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
        <Check className="size-3" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      {counts.openRequired > 0 ? (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-bold tabular-nums text-primary",
          )}
        >
          {counts.openRequired}
        </span>
      ) : null}
      {counts.suggestions > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold tabular-nums text-muted-foreground">
          {counts.suggestions}
        </span>
      ) : null}
    </span>
  );
}
