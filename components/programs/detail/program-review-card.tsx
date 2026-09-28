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
  /** Replaces the student name, e.g. "Bạn". */
  heading?: string;
};

/** Flat review row — the parent list owns borders/dividers. */
export function ProgramReviewCard({
  review,
  className,
  actions,
  heading,
}: ProgramReviewCardProps) {
  const displayName = review.studentName || "Học viên";
  return (
    <article className={cn("flex gap-3", className)}>
      <Avatar size="lg" className="shrink-0">
        {review.studentAvatarUrl ? (
          <AvatarImage src={review.studentAvatarUrl} alt="" />
        ) : null}
        <AvatarFallback className="bg-[#F5F5F0] text-sm font-semibold text-[#6B6B6B]">
          {getExpertInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#2D2D2D]">
              {heading ?? displayName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <StarRating rating={review.starRating} size={15} />
              <time
                dateTime={review.createdAt}
                className="text-xs text-[#6B6B6B] tabular-nums"
              >
                {formatReviewDate(review.createdAt)}
                {isReviewEdited(review) ? " · đã chỉnh sửa" : null}
              </time>
            </div>
          </div>
          {actions ? <div className="-mr-2 -mt-1 flex shrink-0">{actions}</div> : null}
        </div>

        {review.comment ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#4A4A4A]">
            {review.comment}
          </p>
        ) : null}
      </div>
    </article>
  );
}
