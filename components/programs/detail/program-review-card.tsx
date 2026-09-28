import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProgramReview } from "@/lib/api/programs";
import {
  formatReviewDate,
  getExpertInitials,
  isReviewEdited,
} from "@/lib/programs/format";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

type ProgramReviewCardProps = {
  review: ProgramReview;
  className?: string;
  /** Owner actions (edit/delete) rendered at the top-right. */
  actions?: ReactNode;
  /** Replaces the student name, e.g. "Đánh giá của bạn". */
  heading?: string;
};

export function ProgramReviewCard({
  review,
  className,
  actions,
  heading,
}: ProgramReviewCardProps) {
  const displayName = review.studentName || "Học viên";
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-[0_2px_12px_rgba(45,45,45,0.04)]",
        className,
      )}
    >
      <div className="flex gap-3">
        <Avatar size="sm" className="mt-0.5 size-9 shrink-0">
          {review.studentAvatarUrl ? (
            <AvatarImage src={review.studentAvatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-[#F5F5F0] text-xs font-medium text-[#6B6B6B]">
            {getExpertInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-sm font-semibold text-[#2D2D2D]">
                {heading ?? displayName}
              </p>
              <time
                dateTime={review.createdAt}
                className="text-xs text-[#6B6B6B] tabular-nums"
              >
                {formatReviewDate(review.createdAt)}
                {isReviewEdited(review) ? " · đã chỉnh sửa" : null}
              </time>
            </div>
            {actions ? <div className="flex shrink-0 gap-1">{actions}</div> : null}
          </div>

          <div className="mt-1">
            <StarRating rating={review.starRating} size={12} />
          </div>
        </div>
      </div>

      {review.comment ? (
        <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[#6B6B6B]">
          <span className="font-serif text-lg leading-none text-[#E5E5E0]" aria-hidden>
            &ldquo;
          </span>
          {review.comment}
        </blockquote>
      ) : null}
    </article>
  );
}
