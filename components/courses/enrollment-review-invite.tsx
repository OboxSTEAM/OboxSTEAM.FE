"use client";

import { ChevronRight, Loader2, Star } from "lucide-react";

import { cn } from "@/lib/utils";

type EnrollmentReviewInviteProps = {
  onClick: () => void;
  isResolving?: boolean;
  className?: string;
};

/** Foot strip inviting a review on a Completed card without a certificate strip. */
export function EnrollmentReviewInvite({
  onClick,
  isResolving = false,
  className,
}: EnrollmentReviewInviteProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isResolving}
      aria-busy={isResolving}
      className={cn(
        "group flex w-full items-center gap-2.5 border-t border-[#E5E5E0] bg-[#F5F5F0] px-4 py-2.5 text-left",
        "motion-safe:transition-colors motion-safe:duration-200 hover:bg-[#EFEFE8]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4FC3F7]",
        "disabled:cursor-wait",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#F5B800] ring-1 ring-[#E5E5E0]">
        {isResolving ? (
          <Loader2 className="size-4 animate-spin text-[#6B6B6B]" aria-hidden />
        ) : (
          <Star className="size-4 fill-[#FDD835]" strokeWidth={2.25} aria-hidden />
        )}
      </span>

      <span className="font-heading min-w-0 flex-1 truncate text-xs font-bold text-[#2D2D2D] sm:text-[13px]">
        Bạn thấy chương trình thế nào?
      </span>

      <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#6B6B6B] group-hover:text-[#2D2D2D]">
        Đánh giá
        <ChevronRight className="size-3.5" aria-hidden />
      </span>
    </button>
  );
}
