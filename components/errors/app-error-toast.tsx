"use client";

import { AlertCircle } from "lucide-react";

import type { AppErrorState } from "@/lib/errors/types";
import { cn } from "@/lib/utils";

type AppErrorToastProps = AppErrorState & {
  className?: string;
};

export function AppErrorToast({
  title,
  reason,
  action,
  className,
}: AppErrorToastProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-[min(100vw-2rem,380px)] gap-3 rounded-xl border border-destructive/25 bg-[#FEF2F2] p-4 text-[#991B1B] shadow-lg",
        className,
      )}
    >
      <div
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[#991B1B]"
        aria-hidden
      >
        <AlertCircle className="size-3.5 stroke-[2.5]" />
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <div className="space-y-1.5 border-t border-destructive/15 pt-2">
          <p className="text-sm leading-relaxed text-[#B91C1C]/85">
            <span className="font-medium text-[#991B1B]">Lý do: </span>
            {reason}
          </p>
          <p className="text-sm leading-relaxed text-[#991B1B]">
            <span className="font-medium">Nên làm: </span>
            {action}
          </p>
        </div>
      </div>
    </div>
  );
}
