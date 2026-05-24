"use client";

import { CircleCheck } from "lucide-react";

import type { AppSuccessState } from "@/lib/errors/types";
import { cn } from "@/lib/utils";

type AppSuccessToastProps = AppSuccessState & {
  className?: string;
};

export function AppSuccessToast({
  title,
  description,
  className,
}: AppSuccessToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-[min(100vw-2rem,380px)] gap-3 rounded-xl border border-[#7CB342]/30 bg-[#F4F9ED] p-4 text-[#3d5c22] shadow-lg",
        className,
      )}
    >
      <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {description ? (
          <p className="text-sm leading-relaxed opacity-90">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
