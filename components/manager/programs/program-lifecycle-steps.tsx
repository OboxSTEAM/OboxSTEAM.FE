import { Check } from "lucide-react";

import type { ProgramStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const STAGE_BY_STATUS: Record<ProgramStatus, number> = {
  Draft: 0,
  Approved: 1,
  Active: 2,
  Inactive: 2,
};

/** Draft → Approved → Active/Inactive, with a note when a live program has lost its approval. */
export function ProgramLifecycleSteps({
  status,
  hasApproval,
  className,
}: {
  status: ProgramStatus;
  /** `null` while the advisory workspace is loading. */
  hasApproval: boolean | null;
  className?: string;
}) {
  const stage = STAGE_BY_STATUS[status];
  const steps = ["Bản nháp", "Đã chấp thuận", status === "Inactive" ? "Ngừng hoạt động" : "Đang mở"];
  const isLiveWithoutApproval = stage === 2 && hasApproval === false;

  return (
    <div className={cn("flex flex-col items-start gap-1.5 sm:items-end", className)}>
      <ol aria-label="Trạng thái chương trình" className="flex items-center gap-1.5 text-xs">
        {steps.map((label, index) => {
          const isDone = index < stage;
          const isCurrent = index === stage;
          return (
            <li key={label} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn("h-px w-4", index <= stage ? "bg-primary/50" : "bg-border")}
                />
              ) : null}
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium",
                  isCurrent && "bg-primary/10 text-primary",
                  isDone && "text-foreground",
                  !isCurrent && !isDone && "text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3" aria-hidden /> : null}
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      {isLiveWithoutApproval ? (
        <p className="text-[11px] text-amber-800 dark:text-amber-300">
          Chưa có chấp thuận cho phiên bản hiện tại
        </p>
      ) : null}
    </div>
  );
}
