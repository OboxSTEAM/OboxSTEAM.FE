import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProgramReview } from "@/lib/api/programs";

import { StarRating } from "./star-rating";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatReviewDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

type ProgramReviewCardProps = {
  review: ProgramReview;
};

export function ProgramReviewCard({ review }: ProgramReviewCardProps) {
  return (
    <article className="py-4">
      <div className="flex gap-3">
        <Avatar size="sm" className="mt-0.5">
          {review.studentAvatarUrl ? (
            <AvatarImage src={review.studentAvatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-[#F5F5F0] text-[#6B6B6B] text-xs font-medium">
            {getInitials(review.studentName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-medium text-sm text-[#2D2D2D]">
              {review.studentName}
            </p>
            <time
              dateTime={review.createdAt}
              className="text-xs text-[#6B6B6B] tabular-nums"
            >
              {formatReviewDate(review.createdAt)}
            </time>
          </div>

          <div className="mt-1">
            <StarRating rating={review.starRating} size={12} />
          </div>

          {review.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">
              {review.comment}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
